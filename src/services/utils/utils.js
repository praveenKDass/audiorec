export const sortRecordings = (recordings) => {
    return recordings.sort((a, b) => b.id - a.id);
};