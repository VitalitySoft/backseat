export interface NavUser {
  id: string;
  name: string;
  role: "USER" | "ADMIN";
  isRider: boolean;
  isSharingActive: boolean;
}
