"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Mail, Phone, Edit, Trash, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from '@/components/ui/use-toast'
import { supabase } from "@/lib/supabaseClient"

interface Citizen {
  id: string
  name: string
  email: string
  phone: string
  address: string
  issuesReported: number
  status: string
  avatar: string
}

export default function CitizensManagementPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddCitizenDialogOpen, setIsAddCitizenDialogOpen] = useState(false)
  const [isEditCitizenDialogOpen, setIsEditCitizenDialogOpen] = useState(false)
  const [newCitizen, setNewCitizen] = useState<Omit<Citizen, 'id' | 'avatar'>>({
    name: "", email: "", phone: "", address: "", issuesReported: 0, status: "Active"
  })
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null)
  const { toast } = useToast()

  // ✅ Fetch citizens from Supabase
  useEffect(() => {
    const fetchCitizens = async () => {
      const { data, error } = await supabase.from("profiles").select("*")
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          issuesReported: c.issues_reported ?? 0,
          status: c.status ?? "Active",
          avatar: c.avatar_url ?? "/placeholder.svg?height=40&width=40"
        }))
        setCitizens(mapped)
      }
    }
    fetchCitizens()
  }, [])

  // ✅ Add citizen
  const handleAddCitizen = async () => {
    if (!newCitizen.name || !newCitizen.email || !newCitizen.phone) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    const { data, error } = await supabase.from("profiles").insert([{
      name: newCitizen.name,
      email: newCitizen.email,
      phone: newCitizen.phone,
      address: newCitizen.address,
      issues_reported: newCitizen.issuesReported,
      status: newCitizen.status,
      avatar_url: "/placeholder.svg?height=40&width=40"
    }]).select().single()

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setCitizens([...citizens, {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        issuesReported: data.issues_reported,
        status: data.status,
        avatar: data.avatar_url
      }])
      setNewCitizen({ name: "", email: "", phone: "", address: "", issuesReported: 0, status: "Active" })
      setIsAddCitizenDialogOpen(false)
      toast({ title: "Success", description: `Citizen ${data.name} added successfully!` })
    }
  }

  // ✅ Edit citizen
  const handleEditCitizen = async () => {
    if (!editingCitizen) return
    const { error } = await supabase.from("profiles").update({
      name: editingCitizen.name,
      email: editingCitizen.email,
      phone: editingCitizen.phone,
      address: editingCitizen.address,
      issues_reported: editingCitizen.issuesReported,
      status: editingCitizen.status,
      avatar_url: editingCitizen.avatar
    }).eq("id", editingCitizen.id)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setCitizens(citizens.map(c => c.id === editingCitizen.id ? editingCitizen : c))
      setIsEditCitizenDialogOpen(false)
      toast({ title: "Success", description: `Citizen ${editingCitizen.name} updated successfully!` })
    }
  }

  // ✅ Delete citizen
  const handleDeleteCitizen = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setCitizens(citizens.filter(c => c.id !== id))
      toast({ title: "Success", description: `Citizen deleted successfully!` })
    }
  }

  const filteredCitizens = citizens.filter((citizen) => {
  const name = citizen.name || ""
  const email = citizen.email || ""
  const id = citizen.id || ""

  return (
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.toLowerCase().includes(searchTerm.toLowerCase())
  )
})


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Citizens Management</h1>
        <p className="text-muted-foreground">Manage registered citizens and their activities.</p>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search citizens by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddCitizenDialogOpen} onOpenChange={setIsAddCitizenDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add New Citizen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Citizen</DialogTitle>
              <DialogDescription>Enter details for the new citizen account.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newCitizen.name} onChange={(e) => setNewCitizen({...newCitizen, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newCitizen.email} onChange={(e) => setNewCitizen({...newCitizen, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input id="phone" type="tel" value={newCitizen.phone} onChange={(e) => setNewCitizen({...newCitizen, phone: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Address</Label>
                <Input id="address" value={newCitizen.address} onChange={(e) => setNewCitizen({...newCitizen, address: e.target.value})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCitizen}>Add Citizen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Citizens list */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Citizens</CardTitle>
          <CardDescription>Overview of all citizen accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCitizens.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">No citizens found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              filteredCitizens.map((citizen) => (
                <div key={citizen.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={citizen.avatar || "/placeholder.svg"} alt={citizen.name} />
                      <AvatarFallback>
  {citizen.name 
    ? citizen.name.split(" ").map((n) => n[0]).join("") 
    : "U"}
</AvatarFallback>

                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{citizen.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {citizen.email}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {citizen.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{citizen.issuesReported}</p>
                      <p className="text-xs text-muted-foreground">Issues Reported</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{citizen.status}</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                    <div className="flex gap-2">
                      {/* Edit Citizen */}
                      <Dialog open={isEditCitizenDialogOpen && editingCitizen?.id === citizen.id} onOpenChange={setIsEditCitizenDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingCitizen(citizen)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Citizen</DialogTitle>
                            <DialogDescription>Edit details for {editingCitizen?.name}.</DialogDescription>
                          </DialogHeader>
                          {editingCitizen && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input value={editingCitizen.name} onChange={(e) => setEditingCitizen({...editingCitizen, name: e.target.value})} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Email</Label>
                                <Input type="email" value={editingCitizen.email} onChange={(e) => setEditingCitizen({...editingCitizen, email: e.target.value})} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Phone</Label>
                                <Input type="tel" value={editingCitizen.phone} onChange={(e) => setEditingCitizen({...editingCitizen, phone: e.target.value})} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Address</Label>
                                <Input value={editingCitizen.address} onChange={(e) => setEditingCitizen({...editingCitizen, address: e.target.value})} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Status</Label>
                                <Input value={editingCitizen.status} onChange={(e) => setEditingCitizen({...editingCitizen, status: e.target.value})} className="col-span-3" />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button type="submit" onClick={handleEditCitizen}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCitizen(citizen.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
