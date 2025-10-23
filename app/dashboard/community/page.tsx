"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ThumbsUp, ThumbsDown, MessageSquare, Flag, Send } from "lucide-react"

// 🧱 Types
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

type Comment = {
  id: string
  post_id: string
  author: string
  avatar?: string | null
  content: string
  created_at: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPosts()
  }, [])

  // ✅ Fetch posts
  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false })
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setPosts(data || [])
      // load comments for each post
      data?.forEach((p) => fetchComments(p.id))
    }
    setLoading(false)
  }

  // ✅ Fetch comments for a post
  async function fetchComments(postId: string) {
    const { data, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) return
    setComments((prev) => ({ ...prev, [postId]: data || [] }))
  }

  // ✅ Add new post (fetch user info from session + profiles)
  async function handleNewPost() {
    if (!newPostContent.trim()) {
      toast({ title: "Error", description: "Post content cannot be empty", variant: "destructive" })
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to post.", variant: "destructive" })
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single()

    const newPost = {
      author: profileData?.first_name + " " + profileData?.last_name || user.email,
      
      content: newPostContent.trim(),
      is_admin: profileData?.role === "admin",
    }

    const { error } = await supabase.from("community_posts").insert([newPost])
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Posted", description: "Your post has been shared." })
      setNewPostContent("")
      fetchPosts()
    }
  }

  // ✅ Add comment to a post
  async function handleAddComment(postId: string) {
    const content = newComment[postId]?.trim()
    if (!content) return

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive" })
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()

    const commentData = {
      post_id: postId,
      author: profileData?.full_name || user.email,
      avatar: profileData?.avatar_url || "/placeholder.svg",
      content,
    }

    const { error } = await supabase.from("community_comments").insert([commentData])
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setNewComment((prev) => ({ ...prev, [postId]: "" }))
      fetchComments(postId)
    }
  }
  

  return (
    <div className="flex flex-col gap-6">
      {/* --- New Post --- */}
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

      {/* --- Posts with comments --- */}
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
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Admin</span>
                  )}
                </div>

                <p className="text-sm mb-3">{post.content}</p>

                {/* Likes/Comments/Report Buttons */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-1" /> {post.dislikes}
                  </Button>
                  <MessageSquare className="h-4 w-4 mr-1" /> {comments[post.id]?.length || 0}
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Flag className="h-4 w-4 mr-1" /> Report
                  </Button>
                </div>

                {/* --- Comments Section --- */}
                <div className="ml-8 space-y-2">
                  {comments[post.id]?.map((c) => (
                    <div key={c.id} className="flex items-start gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{c.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-md w-fit">
                        <span className="font-medium">{c.author}</span>
                        <span>{c.content}</span>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => handleAddComment(post.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
