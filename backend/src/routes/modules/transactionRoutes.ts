import { FastifyInstance } from "fastify";

// Sales (POS register, orders, items, payments, midtrans gateway)
import { salesOrderRoutes } from "../../modules/pos/salesOrder/salesOrderRoute";
import { salesOrderItemRoutes } from "../../modules/pos/salesOrderItem/salesOrderItemRoute";
import { salesPaymentRoutes } from "../../modules/pos/salesPayment/salesPaymentRoute";
import { midtransRoutes } from "../../modules/pos/midtrans/midtransRoute";
import { discountRoutes } from "../../modules/pos/discount/discountRoutes";
import { shiftRoutes } from "../../modules/pos/shift/shiftRoutes";

// Purchase (Procurement, RFQ, PO, Request)
import { rfqRoutes } from "../../modules/order/rfq/rfqRoute";
import { rfqProductRoutes } from "../../modules/order/rfqProduct/rfqProductRoute";
import { purchaseOrderRoutes } from "../../modules/order/purchaseOrder/purchaseOrderRoute";
import { purchaseOrderProductRoutes } from "../../modules/order/purchaseOrderProduct/purchaseOrderProductRoute";
import { requestRoutes } from "../../modules/order/request/requestRoute";

// Payroll (Periods, components, salary records)
import { payrollPeriodRoutes } from "../../modules/payroll/payrollPeriod/payrollPeriodRoute";
import { payrollComponentRoutes } from "../../modules/payroll/payrollComponent/payrollComponentRoute";
import { salaryRecordRoutes } from "../../modules/payroll/salaryRecord/salaryRecordRoute";

// Rents (Equipment lease rates, rental pricing, tiers)
import { equipmentPriceRoutes } from "../../modules/equipment/equipmentPrice/equipmentPriceRoute";

/**
 * Transaction Module Routes:
 * - Sales (POS, Sales Orders, Split Payment, Cashier)
 * - Purchase (Procurement, RFQ, Purchase Orders)
 * - Payroll (Salary Records, Pay Periods, Compensation Components)
 * - Rents (Equipment Rental & Lease Pricing Tiers)
 */
export async function transactionRoutes(fastify: FastifyInstance, options: any) {
  // Sales
  fastify.register(salesOrderRoutes);
  fastify.register(salesOrderItemRoutes);
  fastify.register(salesPaymentRoutes);
  fastify.register(midtransRoutes);
  fastify.register(discountRoutes);
  fastify.register(shiftRoutes);

  // Purchase
  fastify.register(rfqRoutes);
  fastify.register(rfqProductRoutes);
  fastify.register(purchaseOrderRoutes);
  fastify.register(purchaseOrderProductRoutes);
  fastify.register(requestRoutes);

  // Payroll
  fastify.register(payrollPeriodRoutes);
  fastify.register(payrollComponentRoutes);
  fastify.register(salaryRecordRoutes);

  // Rents
  fastify.register(equipmentPriceRoutes);
}
