
-- Lock down SECURITY DEFINER functions - only callable internally / via service role
REVOKE EXECUTE ON FUNCTION public.assign_ticket_number(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.draw_winner(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- is_admin must remain callable for RLS
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
-- draw_winner callable by authenticated admins (function checks role)
GRANT EXECUTE ON FUNCTION public.draw_winner(UUID) TO authenticated;
