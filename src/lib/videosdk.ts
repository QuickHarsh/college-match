export const createMeeting = async (token: string) => {
    const res = await fetch("https://api.videosdk.live/v2/rooms", {
        method: "POST",
        headers: {
            authorization: `${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });
    const { roomId } = await res.json();
    return roomId;
};
