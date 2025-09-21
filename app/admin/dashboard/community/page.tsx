"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Flag } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CommunityPost {
  id: string
  author: string
  avatar: string
  content: string
  likes: number
  dislikes: number
  comments: number
  isAdmin: boolean
  created_at: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const { toast } = useToast()

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        toast({ title: "Error", description: "Failed to fetch posts", variant: "destructive" })
      } else {
        setPosts(data as CommunityPost[])
      }
    }

    fetchPosts()
  }, [toast])

  // Add new post
  const handleNewPost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: "Error", description: "Post content cannot be empty.", variant: "destructive" })
      return
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert([
        {
          author: "Admin - Current User", // Replace with logged-in admin user
          avatar: "/placeholder.svg?height=32&width=32",
          content: newPostContent,
          is_admin: true,
        }
      ])
      .select()

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setPosts([...(data as CommunityPost[]), ...posts])
      setNewPostContent("")
      toast({ title: "Success", description: "Your post has been published!" })
    }
  }

  // Like
  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ likes: currentLikes + 1 })
      .eq("id", id)

    if (!error) {
      setPosts(posts.map(post => post.id === id ? { ...post, likes: post.likes + 1 } : post))
      toast({ title: "Liked!", description: "You liked this post." })
    }
  }

  // Dislike
  const handleDislike = async (id: string, currentDislikes: number) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ dislikes: currentDislikes + 1 })
      .eq("id", id)

    if (!error) {
      setPosts(posts.map(post => post.id === id ? { ...post, dislikes: post.dislikes + 1 } : post))
      toast({ title: "Disliked!", description: "You disliked this post." })
    }
  }

  // Report
  const handleReport = (id: string) => {
    toast({
      title: "Reported",
      description: `Post ${id} has been reported for review.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
        <p className="text-muted-foreground">Engage with citizens and manage community discussions.</p>
      </div>

      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>Share announcements or start a discussion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="What's on your mind, Admin?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <Button className="w-full" onClick={handleNewPost}>
            <Send className="h-4 w-4 mr-2" /> Post to Community
          </Button>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Community Posts</CardTitle>
          <CardDescription>Latest discussions and announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-muted-foreground">No community posts yet.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                      <AvatarFallback>{post.author?.split(" ").map((n) => n[0]).join("") || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{post.author}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => handleLike(post.id, post.likes)}>
                      <ThumbsUp className="h-4 w-4" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => handleDislike(post.id, post.dislikes)}>
                      <ThumbsDown className="h-4 w-4" /> {post.dislikes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" /> {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleReport(post.id)}>
                      <Flag className="h-4 w-4" /> Report
                    </Button>
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
