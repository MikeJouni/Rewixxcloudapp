import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-white text-center py-4 px-4 sm:px-6 md:px-8 mt-auto text-xs sm:text-sm md:text-base">
    <p>&copy; {year} All Rights Reserved By Rewixx</p>
    </footer>
  );
};


export default Footer;
