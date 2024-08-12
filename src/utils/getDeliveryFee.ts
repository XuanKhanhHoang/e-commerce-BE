export default function getDeliveryFee(district_id: number) {
  if (district_id < 250) {
    return { fee: 25000 };
  }
  if (district_id < 750) return { fee: 30000 };
  if (district_id < 1250) return { fee: 38000 };
  return { fee: 45000 };
}
