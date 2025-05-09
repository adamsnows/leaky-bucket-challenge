"use client";

import RegisterForm from "@/components/register-form";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegisterSuccess = () => {
    setIsRegistered(true);

    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <motion.main
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-primary/10"
      animate={{ backgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"] }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-12">
        <motion.div
          className="flex flex-col items-center justify-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <svg
            width="120"
            viewBox="0 0 377 144"
            version="1.1"
            xmlns="http://www.w3.org/1999/xlink"
            className="mb-4"
          >
            <desc>Woovi Logo</desc>
            <g fill="#133a6f">
              <path d="M296.8,112L296.8,112c-5.9,0-11.2-3.5-13.4-9l-19.9-47.8c-2.5-6,1.9-12.5,8.3-12.5h0c3.7,0,7,2.2,8.4,5.7 l16.6,41.3l16.6-41.3c1.4-3.4,4.7-5.7,8.4-5.7h0c6.5,0,10.8,6.6,8.3,12.5L310.2,103C307.9,108.5,302.6,112,296.8,112z"></path>
              <path d="M357.8,14.5c2.1,2.2,3.2,4.7,3.2,7.7c0,3-1.1,5.6-3.2,7.6c-2.1,2-4.8,3-7.9,3c-3.2,0-5.9-1-8-3 s-3.1-4.6-3.1-7.6c0-3,1.1-5.5,3.2-7.7s4.8-3.3,7.9-3.3S355.7,12.4,357.8,14.5z M340.8,102.9V52c0-5,4.1-9.1,9.1-9.1l0,0 c5,0,9.1,4.1,9.1,9.1v50.8c0,5-4.1,9.1-9.1,9.1l0,0C344.9,112,340.8,107.9,340.8,102.9z"></path>
              <g>
                <path d="M77.7,112L77.7,112c-5.5,0-10.2-3.6-11.6-8.8L57,69.4l-9.2,33.8c-1.4,5.2-6.1,8.8-11.5,8.8h0 c-5.3,0-10-3.5-11.5-8.7L10.6,53.7c-1.5-5.3,2.5-10.6,8-10.6h0c3.7,0,7,2.5,8,6.1L37,86.5l9.7-35.6c1.3-4.6,5.4-7.8,10.2-7.8h0 c4.8,0,9,3.2,10.2,7.8l9.7,35.6l10.3-37.3c1-3.6,4.3-6.1,8-6.1h0.1c5.5,0,9.5,5.3,8,10.6l-14.2,49.7C87.7,108.5,83,112,77.7,112z"></path>
              </g>
              <path d="M162.2,83.9c4.9,4.9,9.4,9.4,13.9,13.9c-10.2,12.5-22.9,20.2-39.8,17c-15.7-3-26-12.7-30.1-28.3 c-4.3-16.5,3.3-33.6,18-42c14.7-8.4,33.1-6.2,45.2,5.7c13.5,13.2,26.7,26.7,40.1,40c6.9,6.8,17.1,7.6,24.5,2.1 c8.3-6.2,9.8-18.2,3.4-26.3c-6.5-8.1-18.5-9.4-26.3-2.6c-2.7,2.3-4.9,5.2-7.2,7.8c-5-5-9.5-9.5-14-14c9.9-12.2,22.4-20.5,41-16.8 c15.5,3,27,15.7,29.6,31.6c2.5,15.6-5.7,31.7-20,39.2c-14.6,7.6-32.3,5-44.2-6.7c-13.3-13.2-26.5-26.5-39.8-39.7 c-5.7-5.7-13.7-7.4-20.7-4.2c-7.1,3.2-11,8.8-11.1,16.7c-0.1,7.8,3.5,13.7,10.6,17c7.2,3.3,14,2.3,20-2.9 C157.9,89,160,86.3,162.2,83.9z"></path>
            </g>
          </svg>
        </motion.div>

        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
            initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            whileHover={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            animate={
              isRegistered
                ? {
                    y: [-5, -20],
                    opacity: [1, 0],
                    transition: { duration: 1 },
                  }
                : {}
            }
          >
            <RegisterForm onSuccess={handleRegisterSuccess} />
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link
                  href="/"
                  className="text-primary font-medium hover:underline"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
  );
}
