const cognito_domain = 'https://ca-central-1ko6qmzcu2.auth.ca-central-1.amazoncognito.com';
const client_id = '3k1uempvlqv2uai348aurmcfcd';
const redirect_uri = 'http://localhost:5500/';
const response_type = 'code';
const scope = 'email openid';

export function get_login_url() {
  const login_url =
    `${cognito_domain}/login` +
    `?client_id=${client_id}` +
    `&response_type=${response_type}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}`;

  return login_url;
}

export function redirect_to_login() {
  window.location.href = get_login_url();
}