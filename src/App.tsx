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
  getVideoData?: () => { title?: string }
  getVideoUrl?: () => string
}

type YouTubePlayerState = {
  ENDED: number
  PLAYING: number
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

const catModules = import.meta.glob('./assets/cats/*.{gif,GIF}', {
  eager: true,
  import: 'default',
  query: '?url',
})
const catGifs = Object.fromEntries(
  Object.entries(catModules).map(([path, url]) => [path.split('/').pop(), url as string]),
) as Record<string, string>
const regularCatActions = ['breathing', 'licking', 'licking', 'sitting', 'walking', 'walking'] as const
const jumpDistance = 28
const catNames = ['latte', 'chai'] as const
type CatAction = 'breathing' | 'jumping' | 'licking' | 'playing' | 'sitting' | 'walking'
type CatState = {
  action: CatAction
  position: number
  direction: -1 | 1
  transitionSeconds: number
  nextReaction: 'jumping' | 'playing'
  walksRemaining: number
}

const catGif = (action: CatAction) => catGifs[`siamese-${action}.gif`]
const nextRegularCatState = (cat: CatState): CatState => {
  const action = regularCatActions[Math.floor(Math.random() * regularCatActions.length)]
  if (action !== 'walking') return { ...cat, action, transitionSeconds: 0 }

  const direction = cat.position >= 99 ? -1 : cat.position <= 1 ? 1 : cat.direction
  const position = direction === 1 ? 100 : 0
  return {
    ...cat,
    action,
    position,
    direction,
    transitionSeconds: Math.max(2, Math.abs(position - cat.position) * 0.08),
    walksRemaining: 2 + Math.floor(Math.random() * 2),
  }
}

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
  { name: 'Naruto', subtitle: 'for running toward your next chapter', category: 'anime', images: ['/covers/naruto.png'], cover: '/covers/naruto.png', videoId: 'sNjtroPFQ1s' },
  { name: 'Witcher', subtitle: 'for monster contracts, silver swords, and bad choices', category: 'games', images: ['/covers/witcher.jpg'], cover: '/covers/witcher.jpg', videoId: 'i1qjKo6Ts60' },
  { name: 'Machinarium', subtitle: 'for tiny adventures in a rusted world', category: 'games', images: ['/covers/machinarium.png'], cover: '/covers/machinarium.png', videoId: 'jex5rtwx94k' },
  { name: 'Transistor', subtitle: 'for neon nights and things left unsaid', category: 'games', images: ['/covers/transistor.jpg'], cover: '/covers/transistor.jpg', videoId: '-XR6wiVIfW8' },
  { name: 'Oblivion', subtitle: 'for getting lost somewhere you used to know', category: 'games', images: ['/covers/oblivion.jpg'], cover: '/covers/oblivion.jpg', videoId: 'Dil9i9gOeB0' },
  { name: "Baldur's Gate 3", subtitle: 'for questionable parties and questionable decisions', category: 'games', images: ['/covers/all-game.jpg'], cover: '/covers/baldurs-gate-3.jpg', videoId: 'Vofkw9-O18c' },
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
    : station.name === 'Naruto'
      ? 'https://www.youtube.com/embed/videoseries?list=PLF7A13C44809B5893&autoplay=1&loop=1&playlist=PLF7A13C44809B5893&rel=0'
    : station.name === 'Witcher'
      ? 'https://www.youtube.com/embed/videoseries?list=PL1ij2T_0HM3TnXecXuyqMgYUB5sHyY1ri&autoplay=1&loop=1&playlist=PL1ij2T_0HM3TnXecXuyqMgYUB5sHyY1ri&rel=0'
    : station.name === 'Machinarium'
      ? 'https://www.youtube.com/embed/videoseries?list=PLDF2E3F105D56FCE6&autoplay=1&loop=1&playlist=PLDF2E3F105D56FCE6&rel=0'
    : station.name === 'Transistor'
      ? 'https://www.youtube.com/embed/videoseries?list=OLAK5uy_mnwVuDUDzpdoyOpy1bbkuKjs3b2AM0L2k&autoplay=1&loop=1&playlist=OLAK5uy_mnwVuDUDzpdoyOpy1bbkuKjs3b2AM0L2k&rel=0'
    : station.name === 'Oblivion'
      ? 'https://www.youtube.com/embed/videoseries?list=PLkyE8Mq1liW38nRM6pXzj00RhEFJRqDJE&autoplay=1&loop=1&playlist=PLkyE8Mq1liW38nRM6pXzj00RhEFJRqDJE&rel=0'
    : station.name === "Baldur's Gate 3"
      ? 'https://www.youtube.com/embed/videoseries?list=PLi1CK-rsvz1Nfz83RMBp_9YaIgBWd0l9x&autoplay=1&loop=1&playlist=PLi1CK-rsvz1Nfz83RMBp_9YaIgBWd0l9x&rel=0'
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
                          ? 'https://www.youtube.com/embed/videoseries?list=PL65E33789AA7052BC&autoplay=1&loop=1&playlist=PL65E33789AA7052BC&rel=0'
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
  const [cats, setCats] = useState<CatState[]>([
    { action: 'breathing', position: 20, direction: 1, transitionSeconds: 0, nextReaction: 'jumping', walksRemaining: 0 },
    { action: 'licking', position: 70, direction: -1, transitionSeconds: 0, nextReaction: 'playing', walksRemaining: 0 },
  ])
  const [stageGif, setStageGif] = useState('')
  const [collectionQueue, setCollectionQueue] = useState<string[]>([])
  const [collectionIndex, setCollectionIndex] = useState(0)
  const [trackTitle, setTrackTitle] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('lofi-theme') as 'dark' | 'light' | null) ?? 'dark',
  )
  const catLoungeRef = useRef<HTMLDivElement>(null)
  const catRefs = useRef<(HTMLButtonElement | null)[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const stageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    localStorage.setItem('lofi-theme', theme)
  }, [theme])

  const catActionKey = cats.map((cat) => cat.action).join('|')

  useEffect(() => {
    const actions = catActionKey.split('|') as CatAction[]
    const timers = actions.map((action, catIndex) => {
      if (action === 'walking') return undefined
      const delay = action === 'jumping'
        ? 900
        : action === 'playing'
          ? 1300
          : 3500 + Math.random() * 3000

      return window.setTimeout(() => {
        setCats((currentCats) => currentCats.map((cat, index) => (
          index === catIndex ? nextRegularCatState(cat) : cat
        )))
      }, delay)
    })

    return () => timers.forEach((timer) => {
      if (timer !== undefined) window.clearTimeout(timer)
    })
  }, [catActionKey])

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
    setTrackTitle('')

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

  const reactToClick = (catIndex: number) => {
    const loungeRect = catLoungeRef.current?.getBoundingClientRect()
    const catRect = catRefs.current[catIndex]?.getBoundingClientRect()
    const availableWidth = loungeRect && catRect ? loungeRect.width - catRect.width : 0
    const currentPosition = loungeRect && catRect && availableWidth > 0
      ? ((catRect.left - loungeRect.left) / availableWidth) * 100
      : null

    setCats((currentCats) => currentCats.map((cat, index) => {
      if (index !== catIndex) return cat
      const action = cat.nextReaction
      const startPosition = currentPosition ?? cat.position
      const needsToTurn = action === 'jumping'
        && (startPosition + cat.direction * jumpDistance > 100 || startPosition + cat.direction * jumpDistance < 0)
      const direction = needsToTurn ? (cat.direction * -1 as -1 | 1) : cat.direction
      const position = action === 'jumping'
        ? Math.min(100, Math.max(0, startPosition + direction * jumpDistance))
        : startPosition

      return {
        ...cat,
        action,
        position,
        direction,
        nextReaction: cat.nextReaction === 'jumping' ? 'playing' : 'jumping',
        transitionSeconds: action === 'jumping' ? 0.36 : 0,
        walksRemaining: 0,
      }
    }))
  }

  const turnCatAround = (catIndex: number) => {
    setCats((currentCats) => currentCats.map((cat, index) => {
      if (index !== catIndex || cat.action !== 'walking') return cat
      if (cat.walksRemaining <= 1) return nextRegularCatState({ ...cat, walksRemaining: 0 })
      const direction = cat.direction === 1 ? -1 : 1
      const position = direction === 1 ? 100 : 0
      return {
        ...cat,
        position,
        direction,
        transitionSeconds: Math.max(2, Math.abs(position - cat.position) * 0.08),
        walksRemaining: cat.walksRemaining - 1,
      }
    }))
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

    let disposed = false
    let lastVideoId = ''

    const pollTitle = () => {
      const videoUrl = playerRef.current?.getVideoUrl?.()
      const videoId = videoUrl?.match(/[?&]v=([^&]+)/)?.[1]
      if (!videoId || videoId === lastVideoId) return
      lastVideoId = videoId

      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (disposed || !data?.title) return
          setTrackTitle(data.title)
        })
        .catch(() => {})
    }

    const intervalId = window.setInterval(pollTitle, 1000)
    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [activeStation])

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
    <main className="app" data-theme={theme}>
      <header className="bar">
        <span className="live"><i /> Wowa cozy soundtrack</span>
        <span className="greeting">Have a cozy day &amp; happy listening 🧋</span>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <svg className="pixel-icon" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
            {theme === 'dark' ? (
              <>
                <path fill="currentColor" d="M7 0h2v2H7zM7 14h2v2H7zM0 7h2v2H0zM14 7h2v2h-2zM2 2h2v2H2zM12 2h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2z" />
                <path fill="currentColor" d="M5 4h6v1h1v2h1v2h-1v2h-1v1H5v-1H4V9H3V7h1V5h1z" />
              </>
            ) : (
              <>
                <path fill="currentColor" d="M7 1h4v1h2v2h2v8h-2v2h-2v1H7v-1H5v-2H3v-2H2V5h1V3h2V1h2z" />
                <path fill="var(--bg)" d="M9 3h2v1h1v2h1v4h-1v2h-1v1H9v-2h1V9h1V6h-1V4H9z" />
              </>
            )}
          </svg>
        </button>
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

      <div className="cat-lounge" ref={catLoungeRef}>
        {cats.map((cat, catIndex) => (
          <button
            key={catIndex}
            ref={(element) => { catRefs.current[catIndex] = element }}
            type="button"
            className={`cat cat-${cat.action} cat-facing-${cat.direction === 1 ? 'right' : 'left'}`}
            style={{
              left: `${cat.position}%`,
              transform: `translateX(-${cat.position}%)`,
              transitionDuration: `${cat.transitionSeconds}s`,
              transitionDelay: cat.action === 'jumping' ? '0.36s' : '0s',
            }}
            onClick={() => reactToClick(catIndex)}
            onTransitionEnd={(event) => {
              if (event.propertyName === 'left') turnCatAround(catIndex)
            }}
            aria-label={`Play with ${catNames[catIndex]}`}
          >
            <img src={catGif(cat.action)} alt="" style={{ transform: `scaleX(${cat.direction})` }} />
            {catIndex === 0 && (
              <span className="cat-purr" aria-hidden="true">
                <i>r</i><i>r</i><i>r</i>
              </span>
            )}
            <span className={`cat-name cat-name-${catNames[catIndex]}`}>{catNames[catIndex]}</span>
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
            <p>{trackTitle || activeStation.subtitle}</p>
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
