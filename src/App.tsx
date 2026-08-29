import { useEffect, useRef, useState } from 'react'
import './App.css'

type Category = 'chill' | 'games' | 'anime' | 'movies'

type Station = {
  name: string
  subtitle: string
  category: Category
  collection?: boolean
  images: string[]
  cover?: string
  gif?: string
  videoId: string
}

type YouTubePlayer = {
  setShuffle: (shuffle: boolean) => void
  nextVideo: () => void
  playVideo: () => void
  destroy: () => void
  loadPlaylist?: (options: { list: string; listType?: string }) => void
}

type YouTubePlayerState = {
  ENDED: number
}

type YouTubeNamespace = {
  Player: new (
    element: HTMLIFrameElement,
    options: { events: { onReady: () => void; onStateChange?: (event: { data: number }) => void } },
  ) => YouTubePlayer
  PlayerState?: YouTubePlayerState
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const tabs: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'chill', label: 'cozy' },
  { id: 'games', label: 'games' },
  { id: 'anime', label: 'anime' },
  { id: 'movies', label: 'movies' },
]

// Collections leave `images` empty: their gallery is pooled from the category's other stations.
// Add any GIF to `src/assets/gifs/`; its filename and station do not matter.
const gifModules = import.meta.glob('./assets/gifs/*.{gif,GIF}', {
  eager: true,
  import: 'default',
  query: '?url',
})
const sharedGifs = Object.values(gifModules) as string[]

if (typeof window !== 'undefined') {
  sharedGifs.forEach((gifUrl) => {
    const img = new Image()
    img.src = gifUrl
  })
}

const getPlaylistConfig = (url: string) => {
  if (!url) return null
  const match = url.match(/list=([^&]+)/)
  if (!match) return null
  const list = match[1]
  const listType = url.includes('listType=search') ? 'search' : 'playlist'
  return { list, listType }
}

const stations: Station[] = [
  { name: 'Borderlands 2', subtitle: 'for questionable decisions and louder explosions', category: 'games', images: ['/covers/borderlands-2.jpg'], videoId: '4xDzrJKXOOY' },
  { name: 'Bloodlines', subtitle: 'for staying up way too late', category: 'games', images: ['/covers/bloodlines.jpg'], cover: '/covers/bloodlines.jpg', videoId: 'jfKfPfyJRdk' },
  { name: 'Starcraft 2', subtitle: 'for when procrastination is no longer an option', category: 'games', images: ['/covers/starcraft-2.jpg'], videoId: 'jfKfPfyJRdk' },
  { name: 'Disco Elysium', subtitle: 'for staring at the ceiling and thinking', category: 'games', images: [ '/covers/disco.jpg'], videoId: '5qap5aO4i9A' },
  { name: 'Diablo IV', subtitle: "for when cozy isn't dark enough", category: 'games', images: ['/covers/diablo.jpg'], videoId: 'zky6hXloEjk' },
  { name: 'Valheim', subtitle: 'for running away from civilization', category: 'games', images: ['/covers/valheim.jpg'], cover: '/covers/valheim.jpg', videoId: 'Q7jlOhxarMY' },
  { name: 'Scavengers Reign', subtitle: 'for feeling small in a very big world', category: 'anime', images: ['/covers/reign.jpg'], videoId: '4xDzrJKXOOY' },
  { name: 'Cowboy Bebop', subtitle: 'for pretending you have somewhere to be', category: 'anime', images: ['/covers/cowboy.jpg'], cover: '/covers/cowboy.jpg', videoId: 'X1-VR_k39lE' },
  { name: 'Wolf Children', subtitle: 'for soft hearts and rainy afternoons', category: 'anime', images: ['/covers/wolfes.jpg'], videoId: 'jfKfPfyJRdk' },
  { name: "Howl's Moving Castle", subtitle: 'for romanticizing absolutely everything', category: 'anime', images: ['/covers/castle.jpg'], videoId: '5qap5aO4i9A' },
  { name: 'Pulp Fiction', subtitle: 'for bad ideas and cool soundtracks', category: 'movies', images: ['/covers/pulp.jpg'], videoId: 'ChCp6xuaFiA' },
  { name: 'Saturday Night Fever', subtitle: 'for when your living room becomes a dance floor', category: 'movies', images: ['/covers/fever.jpg'], cover: '/covers/fever.jpg', videoId: 'zviINyGpldU' },
  { name: 'Perfect Days', subtitle: 'for finding joy in doing nothing special', category: 'movies', images: ['/covers/perfect-days.jpg'], videoId: 'VixdIglCZXk' },
  { name: 'Stardew Valley', subtitle: 'for avoiding your responsibilities in style', category: 'chill', images: ['/covers/stardew.jpg'], videoId: 'FQSHcl6TJb4' },
  { name: 'Skyrim', subtitle: 'for when the real world feels too small', category: 'chill', images: ['/covers/skyrim.jpg'], videoId: '5OWdMHIRld8' },
  { name: 'Wytchwood', subtitle: 'for talking to yourself in the forest', category: 'chill', images: ['/covers/wytchwood.jpg'], videoId: 'jTb1HE2d4DE' },
  { name: 'Fallout 3', subtitle: 'for post-apocalyptic daydreaming', category: 'chill', images: ['/covers/fallout.jpg'], videoId: 'yNK0jzAzKQ8' },
  { name: 'All Cozy Soundtracks', subtitle: 'for blanket days and soft thoughts', category: 'chill', collection: true, images: ['/covers/all-cozy.jpg'], videoId: 'FQSHcl6TJb4' },
  { name: 'All Game Soundtracks', subtitle: "for pretending you're on a quest", category: 'games', collection: true, images: ['/covers/all-game.jpg'], videoId: '5qap5aO4i9A' },
  { name: 'All Anime Soundtracks', subtitle: 'for dramatic walks and main character moments', category: 'anime', collection: true, images: ['/covers/all-anime.jpg'], videoId: 'DWcJFNfaw9c' },
  { name: 'All Movie Soundtracks', subtitle: 'for making ordinary life feel cinematic', category: 'movies', collection: true, images: ['/covers/all-movie.jpg'], videoId: 'ChCp6xuaFiA' },
  { name: 'All Stations', subtitle: 'every station in one rotating mix', category: 'games', collection: true, images: ['/covers/all-game.jpg'], videoId: '5qap5aO4i9A' },
  ]

const randomGif = (currentGif = '') => {
  if (sharedGifs.length <= 1) return sharedGifs[0] ?? ''
  const available = sharedGifs.filter((gif) => gif !== currentGif)
  return available[Math.floor(Math.random() * available.length)] ?? ''
}
const shuffle = <T,>(items: T[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const stationEmbedUrl = (station: Station | null): string => {
  if (!station) return ''

  return station.name === 'Bloodlines'
    ? 'https://www.youtube.com/embed/videoseries?list=PLfzW_wEeYxk6xZzzUQIJnunXj98WGFb07&autoplay=1&loop=1&playlist=PLfzW_wEeYxk6xZzzUQIJnunXj98WGFb07&rel=0'
    : station.name === 'Borderlands 2'
      ? 'https://www.youtube.com/embed/videoseries?list=PLQuh_X6WPn3cvu8kdAogVfbxZWqfrb87J&autoplay=1&loop=1&playlist=PLQuh_X6WPn3cvu8kdAogVfbxZWqfrb87J&rel=0'
      : station.name === 'Starcraft 2'
        ? 'https://www.youtube.com/embed/videoseries?list=PL96A1D3209ECD24F0&autoplay=1&loop=1&playlist=PL96A1D3209ECD24F0&rel=0'
        : station.name === 'Disco Elysium'
          ? 'https://www.youtube.com/embed/videoseries?list=PLRvQDa7VcG0U2rIk9vaTBupvB7RLAlYTY&autoplay=1&loop=1&playlist=PLRvQDa7VcG0U2rIk9vaTBupvB7RLAlYTY&rel=0'
          : station.name === 'Diablo IV'
            ? 'https://www.youtube.com/embed/videoseries?list=OLAK5uy_nj8Ouq8-95MN8pNDuCj154Y3K_ie-iJD8&autoplay=1&loop=1&playlist=OLAK5uy_nj8Ouq8-95MN8pNDuCj154Y3K_ie-iJD8&rel=0'
            : station.name === 'Valheim'
              ? 'https://www.youtube.com/embed/videoseries?list=PLeKS-8gXxk9wFSB-ymp-o80cGi_sPYUk7&autoplay=1&loop=1&playlist=PLeKS-8gXxk9wFSB-ymp-o80cGi_sPYUk7&rel=0'
              : station.name === 'Stardew Valley'
                ? 'https://www.youtube.com/embed/videoseries?list=PLKDOdCjxOjzIFucHobwJpSK4-vAVXST90&autoplay=1&loop=1&playlist=PLKDOdCjxOjzIFucHobwJpSK4-vAVXST90&rel=0'
                : station.name === 'Skyrim'
                  ? 'https://www.youtube.com/embed/videoseries?list=PL8CB7943AB56938F8&autoplay=1&loop=1&playlist=PL8CB7943AB56938F8&rel=0'
                  : station.name === 'Wytchwood'
                    ? 'https://www.youtube.com/embed/videoseries?list=PLwzRcLvcMQi4N3_-MSQH8P9WM58Dry6Be&autoplay=1&loop=1&playlist=PLwzRcLvcMQi4N3_-MSQH8P9WM58Dry6Be&rel=0'
                    : station.name === 'Fallout 3'
                      ? 'https://www.youtube.com/embed/videoseries?list=PL56B9C04452F55AD7&autoplay=1&loop=1&playlist=PL56B9C04452F55AD7&rel=0'
                      : station.name === 'Scavengers Reign'
                        ? 'https://www.youtube.com/embed/videoseries?list=PLRW80bBvVD3WkbW85kHaVD-a-xe2vSZ6R&autoplay=1&loop=1&playlist=PLRW80bBvVD3WkbW85kHaVD-a-xe2vSZ6R&rel=0'
                        : station.name === 'Cowboy Bebop'
                          ? 'https://www.youtube.com/embed?listType=search&list=Cowboy+Bebop+OST&autoplay=1&loop=1&rel=0'
                          : station.name === 'Pulp Fiction'
                            ? 'https://www.youtube.com/embed/videoseries?list=PLF4C445D6E234A0F6&autoplay=1&loop=1&playlist=PLF4C445D6E234A0F6&rel=0'
                            : station.name === 'Saturday Night Fever'
                              ? 'https://www.youtube.com/embed/videoseries?list=PL8Lpw39GxwbMuSZ13zF7ErQgbXsW1Sb3U&autoplay=1&loop=1&playlist=PL8Lpw39GxwbMuSZ13zF7ErQgbXsW1Sb3U&rel=0'
                              : station.name === 'Perfect Days'
                                ? 'https://www.youtube.com/embed/videoseries?list=PLhC3YPiBwS9Vc9nbBG1Dl6y4AfZPD23lm&autoplay=1&loop=1&playlist=PLhC3YPiBwS9Vc9nbBG1Dl6y4AfZPD23lm&rel=0'
                                : station.name === 'Wolf Children'
                                  ? 'https://www.youtube.com/embed/videoseries?list=PLno9aC1A6f6EUARlSTxEHgwQfltpzV4mo&autoplay=1&loop=1&playlist=PLno9aC1A6f6EUARlSTxEHgwQfltpzV4mo&rel=0'
                                  : station.name === "Howl's Moving Castle"
                                    ? 'https://www.youtube.com/embed/videoseries?list=PLS_7XVer-yNAFK0Np8Ok84dbj5j03R2dB&autoplay=1&loop=1&playlist=PLS_7XVer-yNAFK0Np8Ok84dbj5j03R2dB&rel=0'
                                    : station
                                      ? `https://www.youtube.com/embed/${station.videoId}?autoplay=1&rel=0`
                                      : ''
}

const categoryCollectionQueue = (category: Category | 'all') =>
  shuffle(
    stations
      .filter((station) => !station.collection && (category === 'all' || station.category === category))
      .map((station) => stationEmbedUrl(station))
      .filter(Boolean),
  )

function App() {
  const [activeStation, setActiveStation] = useState<Station | null>(null)
  const [activeTab, setActiveTab] = useState<Category | 'all'>('all')
  const [stageGif, setStageGif] = useState('')
  const [collectionQueue, setCollectionQueue] = useState<string[]>([])
  const [collectionIndex, setCollectionIndex] = useState(0)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const stageRef = useRef<HTMLElement>(null)

  const activeStationRef = useRef<Station | null>(null)
  const collectionQueueRef = useRef<string[]>([])
  const collectionIndexRef = useRef(0)

  useEffect(() => {
    activeStationRef.current = activeStation
    collectionQueueRef.current = collectionQueue
    collectionIndexRef.current = collectionIndex
  }, [activeStation, collectionQueue, collectionIndex])

  const visibleStations = stations
    .filter((station) => {
      if (station.name === 'All Stations') return false
      if (activeTab === 'all') return true
      return station.category === activeTab
    })
    .sort((firstStation, secondStation) => Number(Boolean(secondStation.collection)) - Number(Boolean(firstStation.collection)))
  const stageImage = stageGif || activeStation?.images[0] || ''

  const openStation = (station: Station) => {
    setActiveStation(station)
    setStageGif((currentGif) => randomGif(currentGif))

    if (station.collection) {
      const queue = station.name === 'All Stations'
        ? categoryCollectionQueue('all')
        : categoryCollectionQueue(station.category)
      setCollectionQueue(queue)
      setCollectionIndex(0)
    } else {
      setCollectionQueue([])
      setCollectionIndex(0)
    }
  }

  const baseEmbedUrl = activeStation?.collection
    ? collectionQueue[collectionIndex] ?? ''
    : stationEmbedUrl(activeStation)
  const hasPlaylist = baseEmbedUrl.includes('list=')
  const embedUrl = hasPlaylist
    ? `${baseEmbedUrl}&enablejsapi=1`
    : baseEmbedUrl

  const playNextTrack = () => {
    const station = activeStationRef.current
    const queue = collectionQueueRef.current
    const player = playerRef.current

    if (station?.collection && queue.length > 0) {
      const nextIndex = (collectionIndexRef.current + 1) % queue.length
      setCollectionIndex(nextIndex)
      const nextUrl = queue[nextIndex]
      const config = getPlaylistConfig(nextUrl)

      if (config && player && typeof player.loadPlaylist === 'function') {
        player.loadPlaylist(config)
        player.setShuffle(true)
        player.playVideo()
      } else if (player) {
        player.setShuffle(true)
        player.nextVideo()
        player.playVideo()
      }
    } else if (player) {
      player.setShuffle(true)
      player.nextVideo()
      player.playVideo()
    }
  }

  useEffect(() => {
    if (!activeStation || !iframeRef.current) return

    let player: YouTubePlayer | undefined
    let disposed = false

    const initPlayer = () => {
      if (disposed || !iframeRef.current || !window.YT?.Player) return

      player = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            if (disposed) return
            playerRef.current = player ?? null
            player?.setShuffle(true)
            player?.nextVideo()
            player?.playVideo()
          },
          onStateChange: (event) => {
            if (disposed || !window.YT?.PlayerState) return
            if (event.data === window.YT.PlayerState.ENDED) {
              if (activeStationRef.current?.collection) {
                playNextTrack()
              }
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.append(script)
      }
    }

    return () => {
      disposed = true
      player?.destroy()
      if (playerRef.current === player) playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStation?.name])

  useEffect(() => {
    if (!activeStation) return

    stageRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'g' || event.code === 'KeyG') {
        setStageGif((currentGif) => randomGif(currentGif))
      } else if (key === 'a' || event.code === 'KeyA') {
        playNextTrack()
      } else if (key === 'escape' || event.code === 'Escape') {
        setActiveStation(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStation?.name])

  return (
    <main className="app">
      <header className="bar">
        <span className="live"><i /> Wowa cozy soundtrack</span>
        <span className="greeting">Have a cozy day &amp; happy listening 🧋</span>
        <span className="count">{visibleStations.length} stations</span>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={tab.id === activeTab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid">
        {visibleStations.map((station) => (
          <button key={station.name} type="button" className="card" onClick={() => openStation(station)}>
            {station.collection && <span className="badge">mix</span>}
            <span className="vinyl"><span className="vinyl-disc"><img src={station.cover ?? station.images[0] ?? ''} alt="" /></span></span>
            <strong>{station.name}</strong>
            <small>{station.subtitle}</small>
          </button>
        ))}
      </div>

      {activeStation && (
        <section
          ref={stageRef}
          tabIndex={-1}
          className="stage"
          onClick={() => stageRef.current?.focus()}
        >
          <img className="stage-bg" src={stageImage} alt="" />
          <iframe ref={iframeRef} title={activeStation.name} src={embedUrl} allow="autoplay; encrypted-media" tabIndex={-1} />
          <div className="stage-info">
            <span className="live"><i /> live</span>
            <h1>{activeStation.name}</h1>
            <p>{activeStation.subtitle}</p>
          </div>
          <p className="hint">
            <kbd>A</kbd> random track <span>·</span> <kbd>G</kbd> random GIF ({sharedGifs.length}) <span>·</span> <kbd>Esc</kbd> back
          </p>
        </section>
      )}
    </main>
  )
}

export default App
