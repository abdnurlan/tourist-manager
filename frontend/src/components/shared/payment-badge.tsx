import { Badge, type BadgeProps } from "@/components/ui/badge";
import { paymentLabel } from "@/lib/i18n/az";
import type { PaymentStatus } from "@/lib/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const PAYMENT_VARIANT: Record<PaymentStatus, Variant> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
};

export interface PaymentBadgeProps {
  status: PaymentStatus | null | undefined;
  className?: string;
}

/** Payment status pill (unpaid/partial/paid). Renders nothing when null. */
export function PaymentBadge({ status, className }: PaymentBadgeProps) {
  if (!status) return null;
  return (
    <Badge variant={PAYMENT_VARIANT[status]} className={className}>
      {paymentLabel(status)}
    </Badge>
  );
}
