export default function Layout({ children }) {
  const { user, logout } = useAuthStore();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MBC Portal
          </Typography>
          {user && (
            <Button color="inherit" onClick={logout}>Logout</Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children || <Outlet />}
      </Container>
    </>
  );
}
