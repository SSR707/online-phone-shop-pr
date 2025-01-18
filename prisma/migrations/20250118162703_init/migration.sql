-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp" INTEGER NOT NULL,
    "expire_at" DATE NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);
