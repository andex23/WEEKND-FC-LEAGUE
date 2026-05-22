import { z } from "zod"
import { FIFA_CLUBS } from "./constants"

const speedField = (which: "download" | "upload") =>
  z
    .string({ required_error: `Enter your ${which} speed` })
    .trim()
    .min(1, `Enter your ${which} speed`)
    .regex(/^\d+(\.\d+)?$/, "Enter the speed as a number, e.g. 48")
    .refine((v) => Number(v) > 0, `Enter your ${which} speed in Mbps`)
    .refine((v) => Number(v) <= 10000, "That speed looks too high — check the units")

export const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    email: z.string().email("Enter a valid email address"),
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
    psnName: z
      .string()
      .min(3, "PSN ID / Game Tag must be at least 3 characters")
      .max(30, "PSN ID / Game Tag must be less than 30 characters"),
    location: z
      .string()
      .min(2, "Location must be at least 2 characters")
      .max(100, "Location must be less than 100 characters"),
    console: z.enum(["PS5", "XBOX", "PC"], {
      required_error: "Please select a console",
    }),
    preferredClub: z.string().refine((club) => FIFA_CLUBS.includes(club), "Please select a valid FIFA club"),
    downloadMbps: speedField("download"),
    uploadMbps: speedField("upload"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type RegistrationFormData = z.infer<typeof registrationSchema>
