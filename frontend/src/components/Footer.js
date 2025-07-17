import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-white text-center text-sm py-4">
        <p>&copy; {year} All Rights Reserved By Rewixx</p>
    </footer>
  );
};

export default Footer;
