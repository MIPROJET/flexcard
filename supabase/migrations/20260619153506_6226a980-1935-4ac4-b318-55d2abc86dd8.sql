-- Lock down direct anon/authenticated INSERTs on contact_links; route through register_contact_exchange()
DROP POLICY IF EXISTS contact_links_public_insert ON public.contact_links;
REVOKE INSERT ON public.contact_links FROM anon, authenticated;
GRANT INSERT ON public.contact_links TO service_role;
