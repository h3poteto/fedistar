export type Account = {
  id: number;
  domain: string;
  base_url: string;
  username: string;
  account_id: string;
  avatar: string | null;
  client_id: string | null;
  client_secret: string;
  access_token: string;
  refresh_token: string;
};
