import {
	PredefinedScheduledSpec,
	addScheduledJob,
} from "@app/scheduler/scheduler";
import { PaymentInfo } from "@schema/payment";
import { getPaymentStatus, updatePayment } from "@services/payment/payment";
import { type Brand, BrandList } from "@ts-types/brand.t";
import type { SmartPayNotification } from "@ts-types/smartpay.t";
import type { Logger } from "pino";

type ReconcilePaymentJobArgs = {
	brand: Brand;
};

const reconcilePaymentJob = async (
	logger: Logger,
	args: unknown,
): Promise<void> => {
	const date = new Date();
	date.setSeconds(0);
	date.setMilliseconds(0);
	date.setMinutes(date.getMinutes() - 1);
	const argument = args as ReconcilePaymentJobArgs;
	const payments = await PaymentInfo.find({
		needsReconciliation: true,
		brand: argument.brand,
		updatedAt: { $lte: date },
	});

	if (payments.length === 0) {
		logger.info("no payment to reconcile");
	}

	for (const payment of payments) {
		payment.needsReconciliation = false;
		const status = await getPaymentStatus(payment);

		await updatePayment(logger, {
			eventType: "status.updated",
			objectId: payment.transactionId,
			objectType: status.paymentStatus === "CAPTURED" ? "payment" : "refund",
		} as SmartPayNotification);
	}
};

export const initReconcilePaymentJobs = async () => {
	for (const brand of BrandList) {
		await addScheduledJob({
			name: `${brand}-payment-reconciliation`,
			spec: PredefinedScheduledSpec.EVERY_MINUTE,
			Fn: reconcilePaymentJob,
			args: { brand: brand } as ReconcilePaymentJobArgs,
		});
	}
};
