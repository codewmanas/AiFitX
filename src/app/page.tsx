'use client'

import {SignInButton, SignOutButton,  SignUpButton } from "@clerk/nextjs"



const Homepage = () => {
  return (
    <div>
     <SignInButton />
     <SignUpButton />
     <SignOutButton />
    </div>
  )
}

export default Homepage