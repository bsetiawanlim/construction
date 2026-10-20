import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../plugins/prisma";
import { AppError } from "../../utils/errors";
import { success, created, paginated } from "../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter } from "../../utils/pagination";
import {
  CreateFacilityInput,
  UpdateFacilityInput,
  GetFacilitiesQuery,
  CreateFacilitySectionInput,
  UpdateFacilitySectionInput,
  CreateFacilityEmployeeInput,
  UpdateFacilityEmployeeInput,
  CreateFacilityProductInput,
  UpdateFacilityProductInput,
  CreateFacilityEquipmentInput,
  UpdateFacilityEquipmentInput,
  CreateFacilityTableInput,
  UpdateFacilityTableInput,
} from "./facilitySchema";

export async function createFacilityController(
  request: FastifyRequest<{ Body: CreateFacilityInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const existing = await prisma.facility.findFirst({
    where: { facilityCode: data.facilityCode, deletedAt: null },
  });
  if (existing) {
    throw AppError.conflict(`Facility code "${data.facilityCode}" already exists.`);
  }

  const newFacility = await prisma.facility.create({
    data: {
      ...data,
      createdBy: user.id,
    },
    include: {
      sections: { where: { deletedAt: null } },
    },
  });

  return created(reply, newFacility, "Facility created successfully.");
}

export async function updateFacilityController(
  request: FastifyRequest<{ Body: UpdateFacilityInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id, ...data } = request.body;
  const facility = await prisma.facility.findFirst({
    where: { id, deletedAt: null },
  });
  if (!facility) throw AppError.notFound("Facility not found.");

  if (data.facilityCode && data.facilityCode !== facility.facilityCode) {
    const existing = await prisma.facility.findFirst({
      where: { facilityCode: data.facilityCode, deletedAt: null, id: { not: id } },
    });
    if (existing) {
      throw AppError.conflict(`Facility code "${data.facilityCode}" is already taken.`);
    }
  }

  const updated = await prisma.facility.update({
    where: { id },
    data: {
      ...data,
      updatedBy: user.id,
      updatedAt: new Date(),
    },
    include: {
      sections: { where: { deletedAt: null } },
    },
  });

  return success(reply, updated, "Facility updated successfully.");
}

export async function deleteFacilityController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const facility = await prisma.facility.findFirst({
    where: { id, deletedAt: null },
  });
  if (!facility) throw AppError.notFound("Facility not found.");

  await prisma.$transaction([
    prisma.facilitySection.updateMany({
      where: { facilityId: id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: user.id },
    }),
    prisma.facility.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: user.id,
      },
    }),
  ]);

  return success(reply, { id }, "Facility and its sections deleted successfully.");
}

export async function getFacilityController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const { id } = request.body;
  const facility = await prisma.facility.findFirst({
    where: { id, deletedAt: null },
    include: {
      sections: { where: { deletedAt: null } },
      _count: {
        select: {
          sections: true,
          productInventories: true,
          storageStocks: true,
          employees: true,
          facilityEmployees: true,
          facilityProducts: true,
          facilityEquipments: true,
          tables: true,
          purchaseOrders: true,
          salesOrders: true,
        },
      },
    },
  });
  if (!facility) throw AppError.notFound("Facility not found.");

  const user = request.session?.user;
  if (user && !user.isSuperAdmin && user.roleId) {
    const roleFacPerms = await prisma.roleFacilityPermission.findMany({
      where: { roleId: user.roleId, deletedAt: null },
    });
    if (roleFacPerms.length > 0) {
      const allowed = roleFacPerms.some((rfp) => rfp.facilityId === id && rfp.canView);
      if (!allowed) {
        throw AppError.forbidden("Your role does not have permission to access this facility.");
      }
    }
  }

  return success(reply, facility, "Facility fetched successfully.");
}

export async function getFacilitiesController(
  request: FastifyRequest<{ Body?: GetFacilitiesQuery; Querystring?: GetFacilitiesQuery }>,
  reply: FastifyReply
) {
  const params = (request.query && Object.keys(request.query).length > 0)
    ? request.query
    : (request.body || {});

  const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
    defaultLimit: 20,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const searchFilter = buildSearchFilter(params.search, [
    "facilityCode",
    "facilityName",
    "city",
    "province",
    "address",
  ]);

  const user = request.session?.user;

  // Role Facility Permission Matrix check:
  // If user is not superadmin and has a role, only return facilities where role has canView: true.
  // If the role has no entries in roleFacilityPermission, all facilities are accessible by default.
  let allowedFacilityIds: number[] | null = null;
  if (user && !user.isSuperAdmin && user.roleId) {
    const roleFacPerms = await prisma.roleFacilityPermission.findMany({
      where: {
        roleId: user.roleId,
        deletedAt: null,
      },
    });

    if (roleFacPerms.length > 0) {
      allowedFacilityIds = roleFacPerms.filter((rfp) => rfp.canView).map((rfp) => rfp.facilityId);
    }
  }

  const where: any = {
    deletedAt: null,
    ...(allowedFacilityIds !== null ? { id: { in: allowedFacilityIds } } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    ...(searchFilter ? { OR: searchFilter } : {}),
  };

  const [facilities, total] = await Promise.all([
    prisma.facility.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        sections: { where: { deletedAt: null } },
        _count: {
          select: {
            sections: true,
            storageStocks: true,
            employees: true,
            facilityEmployees: true,
            facilityProducts: true,
            facilityEquipments: true,
            tables: true,
            purchaseOrders: true,
            salesOrders: true,
          },
        },
      },
    }),
    prisma.facility.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, facilities, meta, "Facilities fetched successfully.", "facilities");
}

// ── Sections Controllers ──
export async function createFacilitySectionController(
  request: FastifyRequest<{ Body: CreateFacilitySectionInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const facility = await prisma.facility.findFirst({
    where: { id: data.facilityId, deletedAt: null },
  });
  if (!facility) throw AppError.notFound("Facility not found.");

  const existing = await prisma.facilitySection.findFirst({
    where: { facilityId: data.facilityId, sectionCode: data.sectionCode, deletedAt: null },
  });
  if (existing) {
    throw AppError.conflict(`Section code "${data.sectionCode}" already exists in this facility.`);
  }

  const section = await prisma.facilitySection.create({
    data: {
      ...data,
      createdBy: user.id,
    },
  });

  return created(reply, section, "Facility section created successfully.");
}

export async function updateFacilitySectionController(
  request: FastifyRequest<{ Body: UpdateFacilitySectionInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id, ...data } = request.body;
  const section = await prisma.facilitySection.findFirst({
    where: { id, deletedAt: null },
  });
  if (!section) throw AppError.notFound("Section not found.");

  if (data.sectionCode && data.sectionCode !== section.sectionCode) {
    const existing = await prisma.facilitySection.findFirst({
      where: { facilityId: section.facilityId, sectionCode: data.sectionCode, deletedAt: null, id: { not: id } },
    });
    if (existing) {
      throw AppError.conflict(`Section code "${data.sectionCode}" is already taken in this facility.`);
    }
  }

  const updated = await prisma.facilitySection.update({
    where: { id },
    data: {
      ...data,
      updatedBy: user.id,
      updatedAt: new Date(),
    },
  });

  return success(reply, updated, "Facility section updated successfully.");
}

export async function deleteFacilitySectionController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const section = await prisma.facilitySection.findFirst({
    where: { id, deletedAt: null },
  });
  if (!section) throw AppError.notFound("Section not found.");

  await prisma.facilitySection.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, { id }, "Facility section deleted successfully.");
}

export async function getFacilitySectionsController(
  request: FastifyRequest<{ Body: { facilityId: number } }>,
  reply: FastifyReply
) {
  const { facilityId } = request.body;
  const sections = await prisma.facilitySection.findMany({
    where: { facilityId, deletedAt: null },
    include: {
      _count: {
        select: {
          storageStocks: true,
          productInventories: true,
        },
      },
    },
    orderBy: { sectionCode: "asc" },
  });

  return success(reply, sections, "Facility sections fetched successfully.");
}

// ==========================================
// Facility Employees (Many-to-Many Conjunction)
// ==========================================

export async function createFacilityEmployeeController(
  request: FastifyRequest<{ Body: CreateFacilityEmployeeInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const [facility, emp] = await Promise.all([
    prisma.facility.findFirst({ where: { id: data.facilityId, deletedAt: null } }),
    prisma.employee.findFirst({ where: { id: data.employeeId, deletedAt: null } }),
  ]);
  if (!facility) throw AppError.notFound("Facility not found.");
  if (!emp) throw AppError.notFound("Employee not found.");

  const existing = await prisma.facilityEmployee.findFirst({
    where: { facilityId: data.facilityId, employeeId: data.employeeId },
  });

  if (existing && !existing.deletedAt) {
    throw AppError.conflict("Employee is already assigned to this facility.");
  }

  if (data.isPrimary) {
    await prisma.$transaction([
      prisma.facilityEmployee.updateMany({
        where: { employeeId: data.employeeId, isPrimary: true },
        data: { isPrimary: false, updatedAt: new Date(), updatedBy: user.id },
      }),
      prisma.employee.update({
        where: { id: data.employeeId },
        data: { facilityId: data.facilityId, updatedAt: new Date(), updatedBy: user.id },
      }),
    ]);
  }

  let assigned;
  if (existing && existing.deletedAt) {
    assigned = await prisma.facilityEmployee.update({
      where: { id: existing.id },
      data: {
        isPrimary: data.isPrimary ?? false,
        role: data.role ?? null,
        notes: data.notes ?? null,
        deletedAt: null,
        assignedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        employee: {
          include: {
            profile: true,
            position: true,
          },
        },
      },
    });
  } else {
    assigned = await prisma.facilityEmployee.create({
      data: {
        facilityId: data.facilityId,
        employeeId: data.employeeId,
        isPrimary: data.isPrimary ?? false,
        role: data.role ?? null,
        notes: data.notes ?? null,
        createdBy: user.id,
      },
      include: {
        employee: {
          include: {
            profile: true,
            position: true,
          },
        },
      },
    });
  }

  return created(reply, assigned, "Employee assigned to facility successfully.");
}

export async function updateFacilityEmployeeController(
  request: FastifyRequest<{ Body: UpdateFacilityEmployeeInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id, isPrimary, role, notes } = request.body;
  const existing = await prisma.facilityEmployee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility employee assignment not found.");

  if (isPrimary && !existing.isPrimary) {
    await prisma.$transaction([
      prisma.facilityEmployee.updateMany({
        where: { employeeId: existing.employeeId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false, updatedAt: new Date(), updatedBy: user.id },
      }),
      prisma.employee.update({
        where: { id: existing.employeeId },
        data: { facilityId: existing.facilityId, updatedAt: new Date(), updatedBy: user.id },
      }),
    ]);
  }

  const updated = await prisma.facilityEmployee.update({
    where: { id },
    data: {
      ...(isPrimary !== undefined && { isPrimary }),
      ...(role !== undefined && { role }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
    include: {
      employee: {
        include: {
          profile: true,
          position: true,
        },
      },
    },
  });

  return success(reply, updated, "Facility employee assignment updated successfully.");
}

export async function deleteFacilityEmployeeController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const existing = await prisma.facilityEmployee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility employee assignment not found.");

  await prisma.facilityEmployee.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
  });

  if (existing.isPrimary) {
    await prisma.employee.update({
      where: { id: existing.employeeId },
      data: { facilityId: null, updatedAt: new Date(), updatedBy: user.id },
    });
  }

  return success(reply, { id }, "Employee unassigned from facility successfully.");
}

export async function getFacilityEmployeesController(
  request: FastifyRequest<{ Body: { facilityId: number; search?: string } }>,
  reply: FastifyReply
) {
  const { facilityId, search } = request.body;

  const where: any = {
    facilityId,
    deletedAt: null,
    employee: {
      deletedAt: null,
      ...(search
        ? {
            profile: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
  };

  const facilityEmployees = await prisma.facilityEmployee.findMany({
    where,
    include: {
      employee: {
        include: {
          profile: true,
          position: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return success(reply, facilityEmployees, "Facility employees fetched successfully.");
}

export async function getEmployeeFacilitiesController(
  request: FastifyRequest<{ Body: { employeeId: number } }>,
  reply: FastifyReply
) {
  const { employeeId } = request.body;
  const assignments = await prisma.facilityEmployee.findMany({
    where: { employeeId, deletedAt: null, facility: { deletedAt: null } },
    include: {
      facility: true,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return success(reply, assignments, "Employee facility assignments fetched successfully.");
}

// ==========================================
// Facility Products (Many-to-Many Conjunction)
// ==========================================

export async function createFacilityProductController(
  request: FastifyRequest<{ Body: CreateFacilityProductInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const [facility, prod] = await Promise.all([
    prisma.facility.findFirst({ where: { id: data.facilityId, deletedAt: null } }),
    prisma.product.findFirst({ where: { id: data.productId, deletedAt: null } }),
  ]);
  if (!facility) throw AppError.notFound("Facility not found.");
  if (!prod) throw AppError.notFound("Product not found.");

  const existing = await prisma.facilityProduct.findFirst({
    where: { facilityId: data.facilityId, productId: data.productId },
  });

  if (existing && !existing.deletedAt) {
    throw AppError.conflict("Product is already assigned to this facility.");
  }

  let record;
  if (existing && existing.deletedAt) {
    record = await prisma.facilityProduct.update({
      where: { id: existing.id },
      data: {
        isTradeable: data.isTradeable !== undefined ? data.isTradeable : true,
        minStock: data.minStock !== undefined ? data.minStock : null,
        maxStock: data.maxStock !== undefined ? data.maxStock : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes ?? null,
        deletedAt: null,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        product: {
          include: {
            category: true,
            unit: true,
            productPrice: { where: { deletedAt: null } },
            productImages: { where: { deletedAt: null, isPrimary: true } },
          },
        },
      },
    });
  } else {
    record = await prisma.facilityProduct.create({
      data: {
        facilityId: data.facilityId,
        productId: data.productId,
        isTradeable: data.isTradeable !== undefined ? data.isTradeable : true,
        minStock: data.minStock !== undefined ? data.minStock : null,
        maxStock: data.maxStock !== undefined ? data.maxStock : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes ?? null,
        createdBy: user.id,
      },
      include: {
        product: {
          include: {
            category: true,
            unit: true,
            productPrice: { where: { deletedAt: null } },
            productImages: { where: { deletedAt: null, isPrimary: true } },
          },
        },
      },
    });
  }

  return created(reply, record, "Product assigned to facility successfully.");
}

export async function updateFacilityProductController(
  request: FastifyRequest<{ Body: UpdateFacilityProductInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id, isTradeable, minStock, maxStock, isActive, notes } = request.body;
  const existing = await prisma.facilityProduct.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility product not found.");

  const updated = await prisma.facilityProduct.update({
    where: { id },
    data: {
      ...(isTradeable !== undefined && { isTradeable }),
      ...(minStock !== undefined && { minStock }),
      ...(maxStock !== undefined && { maxStock }),
      ...(isActive !== undefined && { isActive }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
    include: {
      product: {
        include: {
          category: true,
          unit: true,
          productPrice: { where: { deletedAt: null } },
          productImages: { where: { deletedAt: null, isPrimary: true } },
        },
      },
    },
  });

  return success(reply, updated, "Facility product updated successfully.");
}

export async function deleteFacilityProductController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const existing = await prisma.facilityProduct.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility product not found.");

  await prisma.facilityProduct.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, { id }, "Product removed from facility successfully.");
}

export async function getFacilityProductsController(
  request: FastifyRequest<{ Body: { facilityId: number; isTradeable?: boolean; isActive?: boolean; search?: string } }>,
  reply: FastifyReply
) {
  const { facilityId, isTradeable, isActive, search } = request.body;

  const where: any = {
    facilityId,
    deletedAt: null,
    ...(isTradeable !== undefined && { isTradeable }),
    ...(isActive !== undefined && { isActive }),
    product: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { productName: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  };

  const facilityProducts = await prisma.facilityProduct.findMany({
    where,
    include: {
      product: {
        include: {
          category: true,
          unit: true,
          productPrice: { where: { deletedAt: null } },
          productImages: { where: { deletedAt: null, isPrimary: true } },
          storageStocks: {
            where: { facilityId },
            include: { section: true },
          },
        },
      },
    },
    orderBy: [{ isTradeable: "desc" }, { createdAt: "desc" }],
  });

  return success(reply, facilityProducts, "Facility products fetched successfully.");
}

// ==========================================
// Facility Equipment (Many-to-Many Conjunction)
// ==========================================

export async function createFacilityEquipmentController(
  request: FastifyRequest<{ Body: CreateFacilityEquipmentInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const [facility, equip] = await Promise.all([
    prisma.facility.findFirst({ where: { id: data.facilityId, deletedAt: null } }),
    prisma.equipmentEntity.findFirst({ where: { id: data.equipmentEntityId, deletedAt: null } }),
  ]);
  if (!facility) throw AppError.notFound("Facility not found.");
  if (!equip) throw AppError.notFound("Equipment entity not found.");

  if (data.sectionId) {
    const section = await prisma.facilitySection.findFirst({
      where: { id: data.sectionId, facilityId: data.facilityId, deletedAt: null },
    });
    if (!section) throw AppError.notFound("Facility section not found.");
  }

  const existing = await prisma.facilityEquipment.findFirst({
    where: { facilityId: data.facilityId, equipmentEntityId: data.equipmentEntityId },
  });

  if (existing && !existing.deletedAt) {
    throw AppError.conflict("Equipment is already assigned to this facility.");
  }

  let record;
  if (existing && existing.deletedAt) {
    record = await prisma.facilityEquipment.update({
      where: { id: existing.id },
      data: {
        sectionId: data.sectionId ?? null,
        status: data.status || "ACTIVE",
        quantity: data.quantity !== undefined ? data.quantity : 1,
        notes: data.notes ?? null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        deletedAt: null,
        assignedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        section: true,
        equipmentEntity: {
          include: {
            brand: true,
            model: true,
            equipmentType: true,
            unit: true,
          },
        },
      },
    });
  } else {
    record = await prisma.facilityEquipment.create({
      data: {
        facilityId: data.facilityId,
        equipmentEntityId: data.equipmentEntityId,
        sectionId: data.sectionId ?? null,
        status: data.status || "ACTIVE",
        quantity: data.quantity !== undefined ? data.quantity : 1,
        notes: data.notes ?? null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: user.id,
      },
      include: {
        section: true,
        equipmentEntity: {
          include: {
            brand: true,
            model: true,
            equipmentType: true,
            unit: true,
          },
        },
      },
    });
  }

  return created(reply, record, "Equipment assigned to facility successfully.");
}

export async function updateFacilityEquipmentController(
  request: FastifyRequest<{ Body: UpdateFacilityEquipmentInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id, sectionId, status, quantity, notes, isActive } = request.body;
  const existing = await prisma.facilityEquipment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility equipment assignment not found.");

  if (sectionId) {
    const section = await prisma.facilitySection.findFirst({
      where: { id: sectionId, facilityId: existing.facilityId, deletedAt: null },
    });
    if (!section) throw AppError.notFound("Facility section not found in this facility.");
  }

  const updated = await prisma.facilityEquipment.update({
    where: { id },
    data: {
      ...(sectionId !== undefined && { sectionId }),
      ...(status !== undefined && { status }),
      ...(quantity !== undefined && { quantity }),
      ...(notes !== undefined && { notes }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
    include: {
      section: true,
      equipmentEntity: {
        include: {
          brand: true,
          model: true,
          equipmentType: true,
          unit: true,
        },
      },
    },
  });

  return success(reply, updated, "Facility equipment updated successfully.");
}

export async function deleteFacilityEquipmentController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const existing = await prisma.facilityEquipment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility equipment assignment not found.");

  await prisma.facilityEquipment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, { id }, "Equipment removed from facility successfully.");
}

export async function getFacilityEquipmentsController(
  request: FastifyRequest<{ Body: { facilityId: number; sectionId?: number; status?: string; search?: string } }>,
  reply: FastifyReply
) {
  const { facilityId, sectionId, status, search } = request.body;

  const where: any = {
    facilityId,
    deletedAt: null,
    ...(sectionId ? { sectionId } : {}),
    ...(status ? { status } : {}),
    equipmentEntity: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  };

  const equipments = await prisma.facilityEquipment.findMany({
    where,
    include: {
      section: true,
      equipmentEntity: {
        include: {
          brand: true,
          model: true,
          equipmentType: true,
          unit: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(reply, equipments, "Facility equipment fetched successfully.");
}

// ── Facility Tables Controllers ──
export async function createFacilityTableController(
  request: FastifyRequest<{ Body: CreateFacilityTableInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const facility = await prisma.facility.findFirst({
    where: { id: data.facilityId, deletedAt: null },
  });
  if (!facility) throw AppError.notFound("Facility not found.");

  if (data.sectionId) {
    const sec = await prisma.facilitySection.findFirst({
      where: { id: data.sectionId, facilityId: data.facilityId, deletedAt: null },
    });
    if (!sec) throw AppError.badRequest("Specified section does not belong to this facility.");
  }

  const existing = await prisma.facilityTable.findFirst({
    where: { facilityId: data.facilityId, tableNumber: data.tableNumber },
  });

  if (existing && !existing.deletedAt) {
    throw AppError.conflict(`Table "${data.tableNumber}" already exists in this facility.`);
  }

  let table;
  if (existing && existing.deletedAt) {
    table = await prisma.facilityTable.update({
      where: { id: existing.id },
      data: {
        sectionId: data.sectionId ?? null,
        label: data.label ?? null,
        capacity: data.capacity ?? 4,
        status: data.status ?? "AVAILABLE",
        qrCode: data.qrCode ?? null,
        isActive: data.isActive ?? true,
        notes: data.notes ?? null,
        deletedAt: null,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        section: true,
      },
    });
  } else {
    table = await prisma.facilityTable.create({
      data: {
        facilityId: data.facilityId,
        sectionId: data.sectionId ?? null,
        tableNumber: data.tableNumber,
        label: data.label ?? null,
        capacity: data.capacity ?? 4,
        status: data.status ?? "AVAILABLE",
        qrCode: data.qrCode ?? null,
        isActive: data.isActive ?? true,
        notes: data.notes ?? null,
        createdBy: user.id,
      },
      include: {
        section: true,
      },
    });
  }

  return created(reply, table, "Facility table created successfully.");
}

export async function updateFacilityTableController(
  request: FastifyRequest<{ Body: UpdateFacilityTableInput }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const data = request.body;
  const existing = await prisma.facilityTable.findFirst({
    where: { id: data.id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility table not found.");

  if (data.tableNumber && data.tableNumber !== existing.tableNumber) {
    const duplicate = await prisma.facilityTable.findFirst({
      where: {
        facilityId: existing.facilityId,
        tableNumber: data.tableNumber,
        deletedAt: null,
        id: { not: data.id },
      },
    });
    if (duplicate) {
      throw AppError.conflict(`Table "${data.tableNumber}" already exists in this facility.`);
    }
  }

  if (data.sectionId) {
    const sec = await prisma.facilitySection.findFirst({
      where: { id: data.sectionId, facilityId: existing.facilityId, deletedAt: null },
    });
    if (!sec) throw AppError.badRequest("Specified section does not belong to this facility.");
  }

  const updated = await prisma.facilityTable.update({
    where: { id: data.id },
    data: {
      ...(data.sectionId !== undefined ? { sectionId: data.sectionId } : {}),
      ...(data.tableNumber ? { tableNumber: data.tableNumber } : {}),
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.qrCode !== undefined ? { qrCode: data.qrCode } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
    include: {
      section: true,
    },
  });

  return success(reply, updated, "Facility table updated successfully.");
}

export async function deleteFacilityTableController(
  request: FastifyRequest<{ Body: { id: number } }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const { id } = request.body;
  const existing = await prisma.facilityTable.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw AppError.notFound("Facility table not found.");

  await prisma.facilityTable.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, { id }, "Facility table deleted successfully.");
}

export async function getFacilityTablesController(
  request: FastifyRequest<{ Body: { facilityId: number; sectionId?: number; status?: string; search?: string } }>,
  reply: FastifyReply
) {
  const { facilityId, sectionId, status, search } = request.body;

  const where: any = {
    facilityId,
    deletedAt: null,
    ...(sectionId ? { sectionId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { tableNumber: { contains: search, mode: "insensitive" } },
            { label: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const tables = await prisma.facilityTable.findMany({
    where,
    include: {
      section: true,
    },
    orderBy: [
      { sectionId: "asc" },
      { tableNumber: "asc" },
    ],
  });

  return success(reply, tables, "Facility tables fetched successfully.");
}
