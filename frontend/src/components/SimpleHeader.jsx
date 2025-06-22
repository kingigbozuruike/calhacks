import Logo from './Logo';

function SimpleHeader() {
  return (
    <header className="px-6 pt-8 pb-2 sticky top-0 z-50 bg-white">
      <div className="flex justify-center items-center max-w-6xl mx-auto">
        <Logo className="text-4xl" />
      </div>
    </header>
  )
}
export default SimpleHeader

