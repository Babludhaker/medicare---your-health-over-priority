"use strict";

const { prisma } = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

/**
 * Departments — a small piece of clinic org structure. Doctors are
 * grouped into departments (e.g. "Cardiology", "Pediatrics").
 */

async function listDepartments(clinicId) {
  return prisma.department.findMany({
    where: { clinicId },
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });
}

async function createDepartment(clinicId, name, description) {
  const existing = await prisma.department.findUnique({
    where: { clinicId_name: { clinicId, name } },
  });
  if (existing)
    throw ApiError.conflict("Department already exists", "DEPT_EXISTS");
  return prisma.department.create({
    data: { clinicId, name, description: description || null },
  });
}

async function deleteDepartment(clinicId, departmentId) {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { _count: { select: { doctors: true } } },
  });
  if (!dept || dept.clinicId !== clinicId) {
    throw ApiError.notFound("Department not found");
  }
  if (dept._count.doctors > 0) {
    throw ApiError.badRequest(
      "Cannot delete a department that still has doctors",
      "DEPT_NOT_EMPTY",
    );
  }
  await prisma.department.delete({ where: { id: departmentId } });
  return { removed: true };
}

module.exports = { listDepartments, createDepartment, deleteDepartment };
