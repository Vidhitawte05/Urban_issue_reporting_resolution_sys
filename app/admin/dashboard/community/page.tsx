"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Flag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CommunityPost {
  id: string
  author: string
  avatar: string | null
  content: string
  likes: number
  dislikes: number
  comments: number
  is_admin: boolean
  created_at: string
}

interface Comment {
  id: string
  post_id: string
  author: string
  avatar: string | null
  content: string
  created_at: string
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newPostContent, setNewPostContent] = useState("")
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar_url?: string | null } | null>(null)

  // ✅ Fetch logged-in user info
  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url, role")
          .eq("id", userData.user.id)
          .single()

        if (profileData) {
          setCurrentUser({
            id: userData.user.id,
            name: `${profileData.first_name} ${profileData.last_name}`,
            avatar_url: profileData.avatar_url,
          })
        }
      }
    }
    fetchUser()
  }, [])

  // ✅ Fetch posts
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

    const channel = supabase
      .channel("community-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, fetchPosts)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [toast])

  // ✅ Fetch comments
  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setComments((prev) => ({ ...prev, [postId]: data }))
    }
  }

  // ✅ Add new post
  const handleNewPost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: "Error", description: "Post content cannot be empty.", variant: "destructive" })
      return
    }

    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" })
      return
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert([
        {
          author: currentUser.name,
          avatar: currentUser.avatar_url || "/placeholder.svg",
          content: newPostContent,
          is_admin: true,
        },
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

  // ✅ Like
  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase.from("community_posts").update({ likes: currentLikes + 1 }).eq("id", id)
    if (!error) {
      setPosts(posts.map((post) => (post.id === id ? { ...post, likes: post.likes + 1 } : post)))
    }
  }

  // ✅ Dislike
  const handleDislike = async (id: string, currentDislikes: number) => {
    const { error } = await supabase.from("community_posts").update({ dislikes: currentDislikes + 1 }).eq("id", id)
    if (!error) {
      setPosts(posts.map((post) => (post.id === id ? { ...post, dislikes: post.dislikes + 1 } : post)))
    }
  }

  // ✅ Report
  const handleReport = (id: string) => {
    toast({ title: "Reported", description: `Post ${id} has been flagged for review.` })
  }

  // ✅ Add comment (reply)
  const handleAddComment = async (postId: string) => {
    const content = replyContent[postId]?.trim()
    if (!content) {
      toast({ title: "Error", description: "Comment cannot be empty.", variant: "destructive" })
      return
    }

    if (!currentUser) {
      toast({ title: "Error", description: "Please log in to comment.", variant: "destructive" })
      return
    }

    const { error } = await supabase.from("community_comments").insert([
      {
        post_id: postId,
        author: currentUser.name,
        avatar: currentUser.avatar_url || "/placeholder.svg",
        content,
      },
    ])

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Comment Added", description: "Your reply has been posted." })
      setReplyContent((prev) => ({ ...prev, [postId]: "" }))
      fetchComments(postId)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
        <p className="text-muted-foreground">Discuss, share, and connect with your community.</p>
      </div>

      {/* Post input */}
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>Start a new discussion</CardDescription>
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

      {/* Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>All community discussions</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border-b pb-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={post.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{post.author}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mb-3 text-sm">{post.content}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => handleLike(post.id, post.likes)}>
                    <ThumbsUp className="h-4 w-4 mr-1" /> {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDislike(post.id, post.dislikes)}>
                    <ThumbsDown className="h-4 w-4 mr-1" /> {post.dislikes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => fetchComments(post.id)}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Comments
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleReport(post.id)}>
                    <Flag className="h-4 w-4 mr-1" /> Report
                  </Button>
                </div>

                {/* Comments Section */}
                {comments[post.id]?.map((comment) => (
                  <div key={comment.id} className="ml-8 mt-3 border-l pl-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))}

                {/* Reply Input */}
                <div className="ml-8 mt-3 flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={replyContent[post.id] || ""}
                    onChange={(e) => setReplyContent({ ...replyContent, [post.id]: e.target.value })}
                  />
                  <Button onClick={() => handleAddComment(post.id)}>
                    <Send className="h-4 w-4" />
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
