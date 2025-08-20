import { z } from "zod"
import { FIFA_CLUBS } from "./constants"

export const registrationSchema = z
  .object({
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
