import StoreNavbar from '../components/StoreNavbar';
import StoreFooter from '../components/StoreFooter';

const StoreLayout = ({ children }) => {
  return (
    <div className="bg-[#FBFBFA] min-h-screen flex flex-col font-sans antialiased text-bakery-dark">
      <StoreNavbar />
      <main className="flex-1 pt-20 w-full">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
};

export default StoreLayout;
