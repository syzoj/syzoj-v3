// If defaultAllow is true, user who in (or one of its groups in) the entites is not allowed,
// or, otherwise, one is allowed.
export default interface IPermissionControl {
    defaultAllow: boolean;
    guestAllow: boolean;
    userUUIDs: string[];
    groupUUIDs: string[];
}
