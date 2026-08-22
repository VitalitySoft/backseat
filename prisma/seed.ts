import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateCharityCode, generateDonationRef, generateTransactionRef } from "../src/lib/ids";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // ---- Charity + campaigns ----
  const charity = await prisma.charity.create({
    data: {
      name: "Backseat Charitable Trust",
      registrationNumber: "CSR-REG-2024-00417",
      description:
        "A registered public charitable trust supporting children's education, nutrition, and emergency medical assistance for underprivileged families across India.",
      beneficiaryUpiVpa: process.env.CHARITY_UPI_VPA ?? "backseat.charity@upi",
      beneficiaryName: process.env.CHARITY_UPI_PAYEE_NAME ?? "Backseat Charitable Trust",
      isActive: true,
    },
  });

  const campaignEducation = await prisma.campaign.create({
    data: {
      charityId: charity.id,
      name: "Meals & School Kits for Children",
      description:
        "Provides daily nutritious meals and school supplies to children from low-income families in partner communities.",
      goalAmount: 2_000_000,
      amountDistributed: 842_300,
      beneficiariesSupported: 1240,
      isActive: true,
      startedAt: daysAgo(300),
    },
  });

  const campaignMedical = await prisma.campaign.create({
    data: {
      charityId: charity.id,
      name: "Emergency Medical Assistance Fund",
      description:
        "Covers urgent medical costs — medicines, diagnostics, and hospital bills — for families who cannot afford them.",
      goalAmount: 1_000_000,
      amountDistributed: 316_900,
      beneficiariesSupported: 410,
      isActive: true,
      startedAt: daysAgo(180),
    },
  });

  // ---- Admin ----
  await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@backseat.app",
      passwordHash: await hash("Admin@123"),
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // ---- Riders ----
  const riderSeed = [
    {
      name: "Ravi Kumar",
      email: "demo.rider@backseat.app",
      phone: "+919810000001",
      vehicleType: "FOUR_WHEELER",
      make: "Maruti Suzuki",
      model: "Ertiga",
      plate: "KA 05 MJ 4471",
      seats: 3,
      route: ["Koramangala, Bengaluru", "Whitefield, Bengaluru"],
      target: 25450,
    },
    {
      name: "Suresh Patil",
      email: "suresh@example.com",
      phone: "+919810000002",
      vehicleType: "FOUR_WHEELER",
      make: "Hyundai",
      model: "i20",
      plate: "MH 12 AB 8823",
      seats: 2,
      route: ["Andheri East, Mumbai", "Bandra Kurla Complex, Mumbai"],
      target: 18200,
    },
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+919810000003",
      vehicleType: "TWO_WHEELER",
      make: "TVS",
      model: "Jupiter",
      plate: "DL 3S CA 9012",
      seats: 1,
      route: ["Connaught Place, Delhi", "Karol Bagh, Delhi"],
      target: 15750,
    },
    {
      name: "Anil Reddy",
      email: "anil@example.com",
      phone: "+919810000004",
      vehicleType: "TWO_WHEELER",
      make: "Honda",
      model: "Activa",
      plate: "TS 09 EQ 5541",
      seats: 1,
      route: ["Gachibowli, Hyderabad", "Hitech City, Hyderabad"],
      target: 12400,
    },
    {
      name: "Meena Iyer",
      email: "meena@example.com",
      phone: "+919810000005",
      vehicleType: "FOUR_WHEELER",
      make: "Tata",
      model: "Nexon",
      plate: "TN 07 CZ 3390",
      seats: 3,
      route: ["Adyar, Chennai", "OMR, Chennai"],
      target: 6300,
    },
  ];

  const riderRecords = [];
  for (const r of riderSeed) {
    const user = await prisma.user.create({
      data: {
        name: r.name,
        email: r.email,
        phone: r.phone,
        passwordHash: await hash("Demo@123"),
        emailVerified: true,
        phoneVerified: true,
        leaderboardDisplay: "FULL_NAME",
        riderProfile: {
          create: {
            vehicleType: r.vehicleType,
            vehicleMake: r.make,
            vehicleModel: r.model,
            vehiclePlate: r.plate,
            seatsAvailable: r.seats,
            isVehicleVerified: true,
            isSharingActive: true,
            charityCode: generateCharityCode(),
            bio: `Travels the ${r.route[0]} → ${r.route[1]} route regularly and loves good company.`,
          },
        },
      },
      include: { riderProfile: true },
    });
    riderRecords.push({ user, route: r.route, vehicleType: r.vehicleType, seats: r.seats, target: r.target });
  }

  // ---- Passengers ----
  const passengerSeed = [
    { name: "Kavya Nair", email: "kavya@example.com" },
    { name: "Rahul Verma", email: "rahul@example.com" },
    { name: "Ayesha Khan", email: "ayesha@example.com" },
    { name: "Demo Passenger", email: "demo.passenger@backseat.app" },
  ];
  const passengers = [];
  for (const p of passengerSeed) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: await hash("Demo@123"),
        emailVerified: true,
        leaderboardDisplay: "FIRST_NAME_INITIAL",
      },
    });
    passengers.push(user);
  }

  // ---- Ride offers + joins (so dashboards/stats have real "people helped" numbers) ----
  const rideOffers = [];
  for (const r of riderRecords) {
    if (!r.user.riderProfile) continue;
    const offer = await prisma.rideOffer.create({
      data: {
        riderId: r.user.riderProfile.id,
        vehicleType: r.vehicleType,
        seatsAvailable: r.seats,
        startLocation: r.route[0],
        destination: r.route[1],
        status: "ACTIVE",
      },
    });
    rideOffers.push(offer);
  }

  let joinSeq = 0;
  for (const offer of rideOffers) {
    const joinCount = 2 + (joinSeq % 3);
    for (let i = 0; i < joinCount; i++) {
      joinSeq += 1;
      const passenger = passengers[joinSeq % passengers.length];
      await prisma.rideJoin.create({
        data: {
          rideOfferId: offer.id,
          passengerId: passenger.id,
          status: i === 0 ? "REQUESTED" : "COMPLETED",
          createdAt: daysAgo(Math.floor(Math.random() * 90)),
        },
      });
    }
  }

  // ---- Donations (spread across the last 5 months to power charts + leaderboard) ----
  let seq = 0;
  for (const r of riderRecords) {
    if (!r.user.riderProfile) continue;
    let remaining = r.target;
    while (remaining > 200) {
      const amount = Math.min(remaining, Math.round((150 + Math.random() * 1500) / 10) * 10);
      remaining -= amount;
      seq += 1;
      const passenger = passengers[seq % passengers.length];
      const campaign = seq % 2 === 0 ? campaignEducation : campaignMedical;
      const createdAt = daysAgo(Math.floor(Math.random() * 150));
      await prisma.donation.create({
        data: {
          donationRef: generateDonationRef(),
          amount,
          riderId: r.user.riderProfile.id,
          passengerId: passenger.id,
          charityId: charity.id,
          campaignId: campaign.id,
          status: "SUCCESS",
          paymentMethod: "UPI",
          transactionRef: generateTransactionRef(),
          donorDisplayNameSnapshot: passenger.name,
          createdAt,
          completedAt: createdAt,
        },
      });
    }
  }

  // A couple of failed/pending donations to prove they never affect the leaderboard
  const firstRider = riderRecords[0].user.riderProfile!;
  await prisma.donation.create({
    data: {
      donationRef: generateDonationRef(),
      amount: 500,
      riderId: firstRider.id,
      passengerId: passengers[0].id,
      charityId: charity.id,
      campaignId: campaignEducation.id,
      status: "FAILED",
      paymentMethod: "UPI",
      createdAt: daysAgo(2),
    },
  });
  await prisma.donation.create({
    data: {
      donationRef: generateDonationRef(),
      amount: 300,
      riderId: firstRider.id,
      passengerId: passengers[1].id,
      charityId: charity.id,
      campaignId: campaignMedical.id,
      status: "PENDING",
      paymentMethod: "UPI",
      createdAt: daysAgo(0),
    },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@backseat.app / Admin@123");
  console.log("Demo rider login: demo.rider@backseat.app / Demo@123");
  console.log("Demo passenger login: demo.passenger@backseat.app / Demo@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
