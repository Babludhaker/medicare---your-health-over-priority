'use strict';

/**
 * Database seed.
 *
 * Populates:
 *  - the three SaaS subscription plans (Basic / Pro / Enterprise)
 *  - the platform SUPER_ADMIN account
 *  - a demo clinic with admin, doctor, receptionist and patient,
 *    plus a department and a weekly availability template
 *
 * Run with:  npm run seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);

async function seedPlans() {
  const plans = [
    {
      tier: 'BASIC',
      name: 'Basic',
      priceMonthly: 999.0,
      maxDoctors: 3,
      maxAppointments: 300,
      features: ['Appointment scheduling', 'Patient records', 'Email reminders'],
    },
    {
      tier: 'PRO',
      name: 'Pro',
      priceMonthly: 2499.0,
      maxDoctors: 10,
      maxAppointments: 2000,
      features: [
        'Everything in Basic',
        'SMS reminders',
        'Online payments',
        'Analytics dashboard',
      ],
    },
    {
      tier: 'ENTERPRISE',
      name: 'Enterprise',
      priceMonthly: 5999.0,
      maxDoctors: 100,
      maxAppointments: -1,
      features: [
        'Everything in Pro',
        'Unlimited appointments',
        'Priority support',
        'Audit log export',
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }
  console.log(`✓ Seeded ${plans.length} subscription plans`);
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@medicareconnect.app';
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe123!';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hash(password),
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
      clinicId: null,
    },
  });
  console.log(`✓ Seeded super admin: ${email}`);
}

async function seedDemoClinic() {
  // Clinic tenant
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'demo-clinic' },
    update: {},
    create: {
      name: 'Demo Clinic',
      slug: 'demo-clinic',
      email: 'hello@democlinic.test',
      phone: '+910000000000',
      address: '1 Demo Street, Indore, MP',
      timezone: 'Asia/Kolkata',
    },
  });

  // Trial subscription on the Pro plan
  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { tier: 'PRO' } });
  if (proPlan) {
    await prisma.clinicSubscription.upsert({
      where: { clinicId: clinic.id },
      update: {},
      create: {
        clinicId: clinic.id,
        planId: proPlan.id,
        status: 'TRIALING',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Department
  const department = await prisma.department.upsert({
    where: { clinicId_name: { clinicId: clinic.id, name: 'General Medicine' } },
    update: {},
    create: { clinicId: clinic.id, name: 'General Medicine' },
  });

  // Clinic admin
  await prisma.user.upsert({
    where: { email: 'admin@democlinic.test' },
    update: {},
    create: {
      email: 'admin@democlinic.test',
      passwordHash: await hash('ChangeMe123!'),
      firstName: 'Clinic',
      lastName: 'Admin',
      role: 'CLINIC_ADMIN',
      isVerified: true,
      clinicId: clinic.id,
    },
  });

  // Receptionist
  await prisma.user.upsert({
    where: { email: 'reception@democlinic.test' },
    update: {},
    create: {
      email: 'reception@democlinic.test',
      passwordHash: await hash('ChangeMe123!'),
      firstName: 'Front',
      lastName: 'Desk',
      role: 'RECEPTIONIST',
      isVerified: true,
      clinicId: clinic.id,
    },
  });

  // Doctor (user + profile + availability)
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@democlinic.test' },
    update: {},
    create: {
      email: 'doctor@democlinic.test',
      passwordHash: await hash('ChangeMe123!'),
      firstName: 'Asha',
      lastName: 'Verma',
      role: 'DOCTOR',
      isVerified: true,
      clinicId: clinic.id,
    },
  });

  const doctorProfile = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      clinicId: clinic.id,
      departmentId: department.id,
      specialization: 'General Physician',
      qualification: 'MBBS, MD',
      experienceYears: 8,
      consultationFee: 500.0,
      bio: 'Experienced general physician.',
    },
  });

  // Weekly availability: Mon–Fri 09:00–13:00, 30-min slots
  for (let day = 1; day <= 5; day += 1) {
    await prisma.availability.upsert({
      where: {
        doctorId_dayOfWeek_startTime: {
          doctorId: doctorProfile.id,
          dayOfWeek: day,
          startTime: '09:00',
        },
      },
      update: {},
      create: {
        doctorId: doctorProfile.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '13:00',
        slotMinutes: 30,
      },
    });
  }

  // Patient (user + profile)
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@democlinic.test' },
    update: {},
    create: {
      email: 'patient@democlinic.test',
      passwordHash: await hash('ChangeMe123!'),
      firstName: 'Ravi',
      lastName: 'Kumar',
      role: 'PATIENT',
      isVerified: true,
      clinicId: clinic.id,
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      clinicId: clinic.id,
      dateOfBirth: new Date('1990-05-20'),
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: 'None',
    },
  });

  console.log('✓ Seeded demo clinic with admin, doctor, receptionist, patient');
}

async function main() {
  console.log('Seeding database...');
  await seedPlans();
  await seedSuperAdmin();
  await seedDemoClinic();
  console.log('\nSeed complete.');
  console.log('Demo logins (password: ChangeMe123!):');
  console.log('  admin@democlinic.test       (CLINIC_ADMIN)');
  console.log('  doctor@democlinic.test      (DOCTOR)');
  console.log('  reception@democlinic.test   (RECEPTIONIST)');
  console.log('  patient@democlinic.test     (PATIENT)');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
