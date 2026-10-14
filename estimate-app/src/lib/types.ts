export type Item = { description: string; qty: number; price: number };
export type Status = "draft" | "sent" | "viewed" | "accepted" | "declined";

export type Profile = {
  id: string;
  business_name: string;
  logo_url: string | null;
  address: string | null;
  license: string | null;
  phone: string | null;
  owner_contact: string | null;
  default_terms: string | null;
};

export type Estimate = {
  id: string;
  user_id: string;
  public_token: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  items: Item[];
  notes: string | null;
  total: number;
  status: Status;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  signer_name: string | null;
  signature: string | null;
  decline_reason: string | null;
  created_at: string;
};
