"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockKeyhole,
  ArrowRight,
  CreditCard,
  Fingerprint,
  ArrowLeft,
} from "lucide-react";
import LoginForm from "@/components/login-form";
import PixTransactionForm from "@/components/pix-transaction-form";
import TokenDisplay from "@/components/token-display";
import Link from "next/link";

const steps = [
  { id: "login", title: "Login", icon: <LockKeyhole className="h-6 w-6" /> },
  {
    id: "transaction",
    title: "Transação",
    icon: <CreditCard className="h-6 w-6" />,
  },
  { id: "token", title: "Token", icon: <Fingerprint className="h-6 w-6" /> },
];

const containerVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  }),
};

const iconVariants = {
  inactive: { scale: 1 },
  active: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.5,
      times: [0, 0.5, 1],
    },
  },
  complete: {
    scale: 1,
    transition: { duration: 0.3 },
  },
};

const stepBackgrounds = {
  login: "from-blue-50 to-primary/10",
  transaction: "from-primary/5 to-primary/10",
  token: "from-primary/5 to-primary/15",
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState<
    "login" | "transaction" | "token"
  >("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [direction, setDirection] = useState(1);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setDirection(1);
    setCurrentStep("transaction");
  };

  const handleTransactionComplete = () => {
    setDirection(1);
    setCurrentStep("token");
  };

  const handleBackToTransactions = () => {
    setDirection(-1);
    setCurrentStep("transaction");
  };

  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <motion.main
      className={`min-h-screen flex items-center justify-center bg-gradient-to-b ${stepBackgrounds[currentStep]}`}
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

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 ${
                    index <= currentIndex
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  variants={iconVariants}
                  initial={false}
                  animate={
                    index < currentIndex
                      ? "complete"
                      : index === currentIndex
                      ? "active"
                      : "inactive"
                  }
                  whileHover={{ scale: 1.05 }}
                >
                  {index < currentIndex ? (
                    <motion.div
                      className="flex items-center justify-center w-full h-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="flex items-center justify-center w-full h-full"
                      initial={{ opacity: index > currentIndex ? 0.7 : 1 }}
                      animate={{ opacity: index > currentIndex ? 0.7 : 1 }}
                    >
                      {step.icon}
                    </motion.div>
                  )}
                </motion.div>

                <span
                  className={`hidden md:block ml-2 mr-6 text-sm font-medium ${
                    index <= currentIndex ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>

                {index < steps.length - 1 && (
                  <div className="w-12 md:w-16 h-1 mx-2 bg-gray-200 relative overflow-hidden">
                    <motion.div
                      className="h-full bg-primary absolute left-0 top-0"
                      initial={{ width: "0%" }}
                      animate={{
                        width:
                          index < currentIndex
                            ? "100%"
                            : index === currentIndex
                            ? "50%"
                            : "0%",
                      }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={direction}
            className="max-w-xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              {currentStep === "login" && (
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
                  initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                  whileHover={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Login
                    </h2>
                    <LoginForm onSuccess={handleLoginSuccess} />

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Ainda não tem uma conta?{" "}
                        <Link
                          href="/register"
                          className="text-primary font-medium hover:underline"
                        >
                          Cadastre-se
                        </Link>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === "transaction" && (
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
                  initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                  whileHover={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Iniciar Transação Pix
                    </h2>
                    <Suspense
                      fallback={
                        <div className="flex justify-center py-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-8 h-8 border-b-2 border-primary rounded-full"
                          />
                        </div>
                      }
                    >
                      <PixTransactionForm
                        onComplete={handleTransactionComplete}
                      />
                    </Suspense>
                    {isAuthenticated && (
                      <motion.div
                        className="mt-4 flex justify-end"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          onClick={() => {
                            setDirection(-1);
                            setCurrentStep("login");
                          }}
                          className="text-primary hover:text-primary/70 text-sm flex items-center"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Voltar para login
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === "token" && (
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                  initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                  whileHover={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                  animate={{
                    boxShadow: [
                      "0 4px 6px rgba(0, 0, 0, 0.1)",
                      "0 8px 15px rgba(19, 58, 111, 0.15)",
                      "0 4px 6px rgba(0, 0, 0, 0.1)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    times: [0, 0.5, 1],
                  }}
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Status do Token
                    </h2>
                    <Suspense
                      fallback={
                        <div className="flex justify-center py-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-8 h-8 border-b-2 border-primary rounded-full"
                          />
                        </div>
                      }
                    >
                      <TokenDisplay />
                    </Suspense>
                    <motion.button
                      onClick={handleBackToTransactions}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para Transações
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
