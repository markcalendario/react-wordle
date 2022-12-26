import React from "react"

export default function Navbar() {
  return (
    <nav>
      <div className="container">
        <div className="wrapper">
          <h2>Wordle</h2>
          <a href="https://github.com/markcalendario/react-wordle">&copy; Mark Kenneth Calendario {new Date().getFullYear()}</a>
        </div>
      </div>
    </nav>
  )
}