import React from 'react';
import './Header.scss';
import logo from '../../assets/logo/icon-transparent-06c8e7d.png';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <img src={logo} alt="laterLeaf logo" />
                    <h2>laterLeaf</h2>
                </div>
                <nav className="nav-links">
                    <a href="#">Unread</a>
                    <a href="#">Favorites</a>
                    <a href="#">Archive</a>
                </nav>
            </div>
            <div className="header-right">
                <div className="search-bar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path
                            d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                        ></path>
                    </svg>
                    <input type="text" placeholder="Search" />
                </div>
                <div className="auth-container">
                    <SignedOut>
                        <SignInButton />
                        <SignUpButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl='/' />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
};

export default Header; 