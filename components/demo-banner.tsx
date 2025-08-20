import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function DemoBanner() {
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Demo Mode:</strong> This league is populated with sample data to showcase the platform. Real fixtures,
        results, and standings are displayed for demonstration purposes.
      </AlertDescription>
    </Alert>
  )
}
