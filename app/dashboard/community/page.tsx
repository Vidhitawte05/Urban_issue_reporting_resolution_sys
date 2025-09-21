"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ThumbsUp, ThumbsDown, MessageSquare, Flag, Send } from "lucide-react"

type CommunityPost = {
  id: string
  author: string
  avatar?: string | null
  content: string
  is_admin: boolean
  likes: number
  dislikes: number
  comments: number
  created_at: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  async function handleNewPost() {
    if (!newPostContent.trim()) {
      toast({ title: "Error", description: "Post content cannot be empty", variant: "destructive" })
      return
    }

    const { error } = await supabase.from("community_posts").insert([
      {
        author: "Admin User", // Replace with logged-in user from profiles
        avatar: "/placeholder.svg?height=32&width=32",
        content: newPostContent.trim(),
        is_admin: true,
      },
    ])

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Posted", description: "Your post has been added." })
      setNewPostContent("")
      fetchPosts()
    }
  }

  async function handleLike(id: string) {
    const { error } = await supabase.rpc("increment_likes", { post_id: id })// optional RPC
    if (error) {
      // fallback: direct update
      await supabase.from("community_posts").update({ likes: supabase.rpc("likes+1") }).eq("id", id)
    }
    fetchPosts()
  }

  async function handleDislike(id: string) {
    const { error } = await supabase.rpc("increment_dislikes", { post_id: id })
    if (error) {
      await supabase.from("community_posts").update({ dislikes: supabase.rpc("dislikes+1") }).eq("id", id)
    }
    fetchPosts()
  }

  function handleReport(id: string) {
    toast({ title: "Reported", description: `Post ${id} has been flagged.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>Share announcements or discussions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <Button onClick={handleNewPost} className="w-full">
            <Send className="h-4 w-4 mr-2" /> Post
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
          <CardDescription>Recent discussions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border-b pb-4 mb-4 last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{post.author}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                  {post.is_admin && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => handleLike(post.id)}>
                    <ThumbsUp className="h-4 w-4 mr-1" /> {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDislike(post.id)}>
                    <ThumbsDown className="h-4 w-4 mr-1" /> {post.dislikes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" /> {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleReport(post.id)}>
                    <Flag className="h-4 w-4 mr-1" /> Report
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
