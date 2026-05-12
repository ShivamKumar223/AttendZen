import { useRouteError, useNavigate } from "react-router-dom";

import "./css/ErrorPage.css";

export const ErrorPage = () => {

  const navigate = useNavigate()
  
  const handleGoBack = () =>{

    navigate(-1);
  }

  const error = useRouteError();
  console.log("Error : ", error);
  return (
    <div className='error-page'>
      <div className='error-section'>
          <div>
            <p>{error.status}: {error.statusText}</p>
            <p>{error.data}</p>
          </div>
          <img src="/404.png" alt="png" />
          <button onClick={handleGoBack}>Go Back</button>
      </div>
      </div>
  )
}
