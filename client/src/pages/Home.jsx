import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const goRegister = (role) => {
    navigate("/signup", { state: { role } }); // pass selected role
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] px-6 py-12 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">
        Choose Your Role
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Rider Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center hover:shadow-xl transition">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3448/3448338.png"
            alt="Rider"
            className="w-24 h-24 mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Rider</h2>
          <p className="text-gray-500 mb-6 text-center">
            Book rides quickly and travel safely with trusted drivers.
          </p>
          <button
            onClick={() => goRegister("rider")}
            className="px-6 py-2 bg-gray-300 text-black rounded-lg shadow hover:bg-blue-700 hover:text-white transition"
          >
            Continue as Rider
          </button>
        </div>

        {/* Driver Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center hover:shadow-xl transition">
          <img
            src="https://cdn-icons-png.flaticon.com/512/296/296216.png"
            alt="Driver"
            className="w-24 h-24 mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Driver</h2>
          <p className="text-gray-500 mb-6 text-center">
            Earn by driving and helping riders reach their destinations.
          </p>
          <button
            onClick={() => goRegister("driver")}
            className="px-6 py-2 bg-gray-300 text-black rounded-lg shadow hover:bg-green-700 hover:text-white transition"
          >
            Continue as Driver
          </button>
        </div>
      </div>
    </div>
  );
}
