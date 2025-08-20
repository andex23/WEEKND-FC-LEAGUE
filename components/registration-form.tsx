"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { registrationSchema, type RegistrationFormData } from "@/lib/validations"
import { FIFA_CLUBS, CONSOLE_OPTIONS } from "@/lib/constants"
import { Loader2, Trophy } from "lucide-react"

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      psnName: "",
      location: "",
      console: undefined,
      preferredClub: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: RegistrationFormData) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Registration failed")
      }

      // Handle success - could redirect or show success message
      console.log("Registration successful")
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <CardTitle className="font-heading text-2xl">Register to Play</CardTitle>
        <CardDescription>Join the Weeknd FC League and compete with FIFA 25 players</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name or nickname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="psnName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PSN ID / Game Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your PSN ID, Xbox Gamertag, or PC username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="console"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Console</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your console" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONSOLE_OPTIONS.map((console) => (
                        <SelectItem key={console.value} value={console.value}>
                          {console.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredClub"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Club</FormLabel>
                  <FormControl>
                    <Combobox
                      options={FIFA_CLUBS}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Choose your FIFA club"
                      searchPlaceholder="Search clubs..."
                      emptyText="No club found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create a secure password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register for League"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
