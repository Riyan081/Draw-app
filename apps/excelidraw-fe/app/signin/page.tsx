import React from 'react'
import AuthPage from '../../components/Auth/AuthPage';
const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14181F] font-sans text-fuchsia-100">
      <AuthPage isSignin={true} />
    </div>
  )
}

export default page