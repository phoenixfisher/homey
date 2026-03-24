import { Link } from 'react-router';

type Props = {
  isLoggedIn: boolean;
  firstName?: string | null;
  onAuthClick: () => void;
};

export function AuthHeaderActions({ isLoggedIn, firstName, onAuthClick }: Props) {
  return (
    <div className="flex items-center gap-2">
      {!isLoggedIn && (
        <Link
          to="/login?mode=register"
          className="px-4 py-2 glass rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all"
        >
          Register Here
        </Link>
      )}

      {isLoggedIn && (
        <Link
          to="/profile"
          className="px-4 py-2 glass rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all"
        >
          My Profile
        </Link>
      )}

      <button
        type="button"
        onClick={onAuthClick}
        className="px-4 py-2 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
      >
        {isLoggedIn ? `Sign Out${firstName ? ` (${firstName})` : ''}` : 'Login'}
      </button>
    </div>
  );
}
