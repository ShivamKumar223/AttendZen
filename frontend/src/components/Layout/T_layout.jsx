import { T_header } from "../components/T_header";
import { Outlet } from "react-router-dom";



export const T_layout = () => {
  return (
    <div>
      <T_header />
      <Outlet />
    </div>
  )
}
