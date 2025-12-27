
import NetworkClient from "./network-client";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  return <NetworkClient />;
}
