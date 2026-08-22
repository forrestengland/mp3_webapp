import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  isAuthenticated: boolean;
}

export default function Navigation({ isAuthenticated }: NavigationProps) {

  const { pathname } = useLocation();

  useEffect(() => {
    console.log(`pathname changed: ${pathname}`);
  }, [pathname]);

  return (
    <>
      	<nav>
	  {pathname !== '/' && <Link to="/">Songs</Link>}
	  {!isAuthenticated ?
	    (pathname !== '/login' && <Link to="/login">Login</Link>) :
	    (pathname !== '/logout' && <Link to="/logout">Logout</Link>)}
  	  {isAuthenticated && pathname !== 'upload' && <Link to="/upload">Upload</Link>}
	</nav>

    </>
  );
}
