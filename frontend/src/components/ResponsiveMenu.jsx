import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useSelector } from "react-redux";
import LoginPage from "./Login";
import userimg from "../assets/user.jpg";

const ResponsiveMenu = ({ openNav, setOpenNav, logoutHandler }) => {
  const { user } = useSelector((store) => store.auth);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);

  // ✅ Handle scroll lock properly
  useEffect(() => {
    if (openNav) {
      document.body.classList.add("overflow-hidden");
      const timer = setTimeout(() => setAnimateItems(true), 100);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove("overflow-hidden");
      };
    } else {
      document.body.classList.remove("overflow-hidden");
      setAnimateItems(false);
    }
  }, [openNav]);

  const handleLinkClick = () => {
    setOpenNav(false);
    document.body.classList.remove("overflow-hidden");
  };

  const handleLogout = () => {
    logoutHandler();
    setOpenNav(false);
    document.body.classList.remove("overflow-hidden");
  };

  const menuItems = [
    { to: "/", label: "Home" },
    { to: "/about-us", label: "About" },
    { to: "/contact-us", label: "Contact" },
  ];

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out md:hidden ${
          openNav ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setOpenNav(false)}
      />

      {/* Sliding Menu */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-[75%] max-w-[300px] bg-white dark:bg-gray-800 
        shadow-2xl transform transition-all duration-300 ease-out md:hidden rounded-r-2xl
        ${openNav ? "translate-x-0 opacity-100" : "-translate-x-full opacity-90"}`}
      >
        <div className="flex flex-col h-full justify-between pb-8">
          {/* Header */}
          <div
            className={`p-6 border-b border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out ${
              animateItems ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              {user ? (
                <Avatar className="w-14 h-14 ring-2 ring-purple-500 dark:ring-gray-100 transition-all duration-300">
                  <AvatarImage src={user.profilePic || userimg} />
                </Avatar>
              ) : (
                <FaUserCircle size={56} className="text-gray-400" />
              )}
              <div>
                <h1 className="font-semibold text-lg">
                  Hello,{" "}
                  <span className="text-purple-500 dark:text-gray-100">
                    {user?.username?.split(" ")[0] || "User"}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 overflow-y-auto">
            <ul className="flex flex-col gap-6 text-xl font-semibold">
              {menuItems.map((item, index) => (
                <li
                  key={item.to}
                  className={`transform transition-all duration-700 ease-out hover:translate-x-2 hover:scale-105 ${
                    animateItems
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-8 opacity-0"
                  }`}
                  style={{
                    transitionDelay: animateItems ? `${index * 120 + 100}ms` : "0ms",
                  }}
                >
                  <Link
                    to={item.to}
                    onClick={handleLinkClick}
                    className="block py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              <li
                className={`mt-6 transform transition-all duration-700 ease-out ${
                  animateItems
                    ? "translate-x-0 opacity-100 scale-100"
                    : "-translate-x-8 opacity-0 scale-95"
                }`}
                style={{
                  transitionDelay: animateItems
                    ? `${menuItems.length * 120 + 200}ms`
                    : "0ms",
                }}
              >
                {user ? (
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-purple-500 hover:bg-purple-600 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsLoginOpen(true)}
                      className="w-full bg-purple-500 hover:bg-purple-600 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Login
                    </Button>
                    <LoginPage open={isLoginOpen} setOpen={setIsLoginOpen} />
                  </>
                )}
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div
            className={`p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 transition-all duration-700 ease-out ${
              animateItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionDelay: animateItems
                ? `${menuItems.length * 150 + 300}ms`
                : "0ms",
            }}
          >
            © {new Date().getFullYear()} <span className="text-purple-500 dark:text-gray-100 font-medium">FYP Buddy</span>. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponsiveMenu;
