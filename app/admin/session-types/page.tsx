"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Users, Clock, Loader2, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const colorOptions = [
  { value: "bg-green-100 text-green-800", label: "Green" },
  { value: "bg-blue-100 text-blue-800", label: "Blue" },
  { value: "bg-purple-100 text-purple-800", label: "Purple" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
  { value: "bg-pink-100 text-pink-800", label: "Pink" },
  { value: "bg-indigo-100 text-indigo-800", label: "Indigo" },
]

export default function SessionTypesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    duration: "",
    price: "",
    color: "bg-green-100 text-green-800",
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch session types
  const {
    data: sessionTypes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sessionTypes"],
    queryFn: async () => {
      const response = await fetch("/api/session-types")
      if (!response.ok) throw new Error("Failed to fetch session types")
      return response.json()
    },
  })

  // Create session type mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/session-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create session type")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionTypes"] })
      setIsDialogOpen(false)
      resetForm()
      toast({
        title: "Session Type Created",
        description: "New session type has been added successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Update session type mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/session-types/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update session type")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionTypes"] })
      setIsDialogOpen(false)
      resetForm()
      toast({
        title: "Session Type Updated",
        description: "The session type has been updated successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Delete session type mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/session-types/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete session type")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionTypes"] })
      toast({
        title: "Session Type Deleted",
        description: "The session type has been removed successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capacity: "",
      duration: "",
      price: "",
      color: "bg-green-100 text-green-800",
    })
    setEditingType(null)
  }

  const handleAdd = () => {
    setIsDialogOpen(true)
    resetForm()
  }

  const handleEdit = (sessionType: any) => {
    setFormData({
      name: sessionType.name,
      description: sessionType.description,
      capacity: sessionType.capacity.toString(),
      duration: sessionType.duration.toString(),
      price: sessionType.price ? sessionType.price.toString() : "",
      color: sessionType.color,
    })
    setEditingType(sessionType)
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.capacity || !formData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const sessionTypeData = {
      name: formData.name,
      description: formData.description,
      capacity: Number.parseInt(formData.capacity),
      duration: Number.parseInt(formData.duration),
      price: formData.price ? Number.parseFloat(formData.price) : null,
      color: formData.color,
    }

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: sessionTypeData })
    } else {
      createMutation.mutate(sessionTypeData)
    }
  }

  const handleDelete = (sessionTypeId: number) => {
    deleteMutation.mutate(sessionTypeId)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Session Types</h1>
          <p className="text-muted-foreground">Manage your Pilates session types and configurations</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load session types</p>
              <p className="text-muted-foreground">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Session Types</h1>
          <p className="text-muted-foreground">Manage your Pilates session types and configurations</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Session Type
        </Button>
      </div>

      {/* Session Types Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Loading session types...</p>
            </div>
          </CardContent>
        </Card>
      ) : sessionTypes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No session types</h3>
              <p className="text-muted-foreground">Create your first session type to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessionTypes.map((sessionType: any) => (
            <Card key={sessionType.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{sessionType.name}</CardTitle>
                  <div className="text-right">
                    <Badge className={sessionType.color}>{sessionType.duration} min</Badge>
                    {sessionType.price && (
                      <div className="text-lg font-bold text-green-600 mt-1">{formatPrice(sessionType.price)}</div>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">{sessionType.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Max Capacity</span>
                  </div>
                  <span className="font-semibold">{sessionType.capacity} people</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <span className="font-semibold">{sessionType.duration} minutes</span>
                </div>

                {sessionType.price && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Price</span>
                    </div>
                    <span className="font-semibold text-green-600">{formatPrice(sessionType.price)}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sessionType)}
                    className="flex-1"
                    disabled={updateMutation.isPending}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sessionType.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Session Type" : "Create New Session Type"}</DialogTitle>
            <DialogDescription>
              {editingType ? "Update the session type details." : "Add a new type of Pilates session to your studio."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Session Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Beginner Pilates"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this session type..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Max Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="8"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (min) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="30"
                  max="120"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (IDR)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="150000"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty if pricing is not applicable</p>
            </div>

            <div>
              <Label htmlFor="color">Badge Color</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: option.value }))}
                    className={`p-2 rounded border-2 transition-colors ${
                      formData.color === option.value ? "border-primary" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Badge className={option.value}>{option.label}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingType ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingType ? "Update" : "Create"} Session Type</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Session Types Summary</CardTitle>
          <CardDescription>Overview of your studio's session offerings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{sessionTypes.length}</div>
              <div className="text-sm text-muted-foreground">Total Types</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sessionTypes.length > 0
                  ? Math.round(
                      sessionTypes.reduce((sum: number, type: any) => sum + type.duration, 0) / sessionTypes.length,
                    )
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {sessionTypes.length > 0
                  ? Math.round(
                      sessionTypes.reduce((sum: number, type: any) => sum + type.capacity, 0) / sessionTypes.length,
                    )
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sessionTypes.reduce((sum: number, type: any) => sum + type.capacity, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Capacity</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
