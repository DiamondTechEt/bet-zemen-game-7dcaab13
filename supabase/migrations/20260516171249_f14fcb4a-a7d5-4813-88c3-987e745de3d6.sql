
-- Enums
CREATE TYPE public.game_status AS ENUM ('draft','active','closed','completed');
CREATE TYPE public.ticket_status AS ENUM ('pending_payment','payment_uploaded','verified','rejected');
CREATE TYPE public.notification_type AS ENUM ('success','error','info');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer helper to check admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = _uid), false);
$$;

CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "admins update any profile" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    NEW.email
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- GAMES
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT,
  ticket_price NUMERIC(12,2) NOT NULL CHECK (ticket_price >= 0),
  total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  status public.game_status NOT NULL DEFAULT 'draft',
  payment_account_name TEXT,
  payment_account_number TEXT,
  payment_bank TEXT,
  game_image_url TEXT,
  winner_ticket_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone view non-draft games" ON public.games FOR SELECT
  USING (status <> 'draft' OR public.is_admin(auth.uid()));
CREATE POLICY "admins insert games" ON public.games FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins update games" ON public.games FOR UPDATE
  USING (public.is_admin(auth.uid()));
CREATE POLICY "admins delete games" ON public.games FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_games_updated BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TICKETS
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_number INTEGER,
  status public.ticket_status NOT NULL DEFAULT 'payment_uploaded',
  payment_reference TEXT NOT NULL,
  payment_bank TEXT NOT NULL,
  payment_phone TEXT,
  payment_suffix TEXT,
  receipt_image_url TEXT,
  verified_amount NUMERIC(12,2),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, ticket_number),
  UNIQUE (game_id, payment_reference)
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins view all tickets" ON public.tickets FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "users create own tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update tickets" ON public.tickets FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "users view verified tickets of completed games" ON public.tickets FOR SELECT
  USING (status='verified' AND EXISTS (SELECT 1 FROM public.games g WHERE g.id=tickets.game_id AND g.status='completed'));

CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic ticket number assignment
CREATE OR REPLACE FUNCTION public.assign_ticket_number(_ticket_id UUID, _verified_amount NUMERIC)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_game_id UUID;
  v_total INTEGER;
  v_next INTEGER;
BEGIN
  SELECT game_id INTO v_game_id FROM public.tickets WHERE id = _ticket_id FOR UPDATE;
  IF v_game_id IS NULL THEN RAISE EXCEPTION 'Ticket not found'; END IF;

  -- Lock game row
  SELECT total_tickets INTO v_total FROM public.games WHERE id = v_game_id FOR UPDATE;

  SELECT COALESCE(MIN(s), v_total + 1) INTO v_next
  FROM generate_series(1, v_total) s
  WHERE s NOT IN (SELECT ticket_number FROM public.tickets WHERE game_id = v_game_id AND ticket_number IS NOT NULL);

  IF v_next > v_total THEN RAISE EXCEPTION 'No tickets available'; END IF;

  UPDATE public.tickets SET
    ticket_number = v_next,
    status = 'verified',
    verified_amount = _verified_amount,
    verified_at = now()
  WHERE id = _ticket_id;

  UPDATE public.games SET tickets_sold = tickets_sold + 1 WHERE id = v_game_id;
  RETURN v_next;
END; $$;

-- WINNER DRAWS
CREATE TABLE public.winner_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE UNIQUE,
  winning_ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  winning_ticket_number INTEGER NOT NULL,
  winner_user_id UUID NOT NULL REFERENCES public.profiles(id),
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  drawn_by UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.winner_draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view winner draws" ON public.winner_draws FOR SELECT USING (true);
CREATE POLICY "admins insert draws" ON public.winner_draws FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Random winner draw function
CREATE OR REPLACE FUNCTION public.draw_winner(_game_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin BOOLEAN;
  v_existing UUID;
  v_ticket RECORD;
BEGIN
  v_admin := public.is_admin(auth.uid());
  IF NOT v_admin THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT id INTO v_existing FROM public.winner_draws WHERE game_id = _game_id;
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Winner already drawn'; END IF;

  SELECT id, ticket_number, user_id INTO v_ticket
  FROM public.tickets
  WHERE game_id = _game_id AND status = 'verified'
  ORDER BY random() LIMIT 1;

  IF v_ticket.id IS NULL THEN RAISE EXCEPTION 'No verified tickets'; END IF;

  INSERT INTO public.winner_draws (game_id, winning_ticket_id, winning_ticket_number, winner_user_id, drawn_by)
  VALUES (_game_id, v_ticket.id, v_ticket.ticket_number, v_ticket.user_id, auth.uid());

  UPDATE public.games SET status='completed', winner_ticket_id = v_ticket.id WHERE id = _game_id;

  INSERT INTO public.notifications (user_id, message, type)
  VALUES (v_ticket.user_id, 'እንኳን ደስ አለዎት! በዕጣ አሸንፈዋል 🏆', 'success');

  RETURN v_ticket.id;
END; $$;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own notifs" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own notifs" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admins view all notifs" ON public.notifications FOR SELECT USING (public.is_admin(auth.uid()));

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view contact" ON public.contact_messages FOR SELECT USING (public.is_admin(auth.uid()));

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

CREATE POLICY "game images public read" ON storage.objects FOR SELECT USING (bucket_id='game-images');
CREATE POLICY "admins upload game images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='game-images' AND public.is_admin(auth.uid()));
CREATE POLICY "admins update game images" ON storage.objects FOR UPDATE
  USING (bucket_id='game-images' AND public.is_admin(auth.uid()));

CREATE POLICY "users upload own receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users view own receipts" ON storage.objects FOR SELECT
  USING (bucket_id='receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

-- Indexes
CREATE INDEX idx_tickets_game ON public.tickets(game_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
