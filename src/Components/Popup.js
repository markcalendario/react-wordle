import React, { useEffect } from "react";

export default function Popup({ title, text, visibilityControl }) {

  useEffect(() => {
    const popupVisibilityTimer = setTimeout(() => {
      visibilityControl(false)
    }, 3000);

    return () => {
      clearTimeout(popupVisibilityTimer)
    }
  }, [visibilityControl])

  return (
    <div className="popup">
      <h4>{title}</h4>
      <p>{text}</p>

    </div>
  )
}