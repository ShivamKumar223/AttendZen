import { NavLink } from "react-router-dom"

//css
import "./css/header_footer.css";

export const Header = () => {

    return (
        <div className={`navbar0`}>
            <div className={`logo`}>
                <h2>AttendZen</h2>
            </div>
            <ul>
                <NavLink to="/"><li>Home</li></NavLink>
                <NavLink to="/about"><li>About</li></NavLink>
                <NavLink to="/contect"><li>Contect</li></NavLink>
                <NavLink to="/help"><li>Help</li></NavLink>
            </ul>
            <div className={`login`}>
                <NavLink to="/login">Login</NavLink>
            </div>
        </div>
    )
}