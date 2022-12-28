import React from "react"

export default function Navbar() {
  return (
    <nav>
      <div className="container">
        <div className="wrapper">
          <a href="https://github.com/markcalendario/react-wordle">
            <h2>Wordle</h2>
            <p>&copy; Mark Kenneth Calendario {new Date().getFullYear()}
            </p>
          </a>
        </div>
      </div>
    </nav>
  )
}