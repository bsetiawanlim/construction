import { FastifyInstance } from "fastify";

// Monetary & Accounting
import { monetaryAccountRoutes } from "../../modules/monetary/account/monetaryAccountRoute";
import { monetaryTransactionRoutes } from "../../modules/monetary/transaction/monetaryTransactionRoute";

// Unit Measurement
import { unitRoutes } from "../../modules/unit/unitRoute";

// Transport & Logistics
import { vehicleRoutes } from "../../modules/transport/vehicle/vehicleRoute";
import { driverRoutes } from "../../modules/transport/driver/driverRoute";
import { tripRoutes } from "../../modules/transport/trip/tripRoute";
import { fuelLogRoutes } from "../../modules/transport/fuelLog/fuelLogRoute";

// Work & Project Management
import { workRoutes } from "../../modules/work/work/workRoute";
import { workItemRoutes } from "../../modules/work/workItem/workItemRoute";
import { workWorkerRoutes } from "../../modules/work/workWorker/workWorkerRoute";
import { workEquipmentRoutes } from "../../modules/work/workEquipment/workEquipmentRoute";
import { workOfferRoutes } from "../../modules/work/workOffer/workOfferRoute";
import { workOfferItemRoutes } from "../../modules/work/workOfferItem/workOfferItemRoute";
import { itemRoutes } from "../../modules/work/item/itemRoute";
import { workerRoutes } from "../../modules/work/worker/workerRoute";
import { taskRoutes } from "../../modules/work/task/taskRoute";

/**
 * General Platform Routes:
 * - Monetary Accounts & Ledger Transactions
 * - Units of Measure
 * - Transport & Fleet Logistics
 * - Work & Project Tasks
 */
export async function generalRoutes(fastify: FastifyInstance, options: any) {
  fastify.register(monetaryAccountRoutes);
  fastify.register(monetaryTransactionRoutes);
  fastify.register(unitRoutes);

  fastify.register(vehicleRoutes);
  fastify.register(driverRoutes);
  fastify.register(tripRoutes);
  fastify.register(fuelLogRoutes);

  fastify.register(workRoutes);
  fastify.register(workItemRoutes);
  fastify.register(workWorkerRoutes);
  fastify.register(workEquipmentRoutes);
  fastify.register(workOfferRoutes);
  fastify.register(workOfferItemRoutes);
  fastify.register(itemRoutes);
  fastify.register(workerRoutes);
  fastify.register(taskRoutes);
}
